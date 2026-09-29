/**
 * PicklePal Auto-Confirm Handler
 * Triggered by EventBridge every hour to check for expired confirmation tokens
 * and auto-confirm scores that haven't been disputed within the time window.
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const snsClient = new SNSClient({});

const MATCHUPS_TABLE = process.env.MATCHUPS_TABLE;
const TOKENS_TABLE = process.env.TOKENS_TABLE;
const AUDIT_TABLE = process.env.AUDIT_TABLE;
const AUTO_CONFIRM_HOURS = parseInt(process.env.AUTO_CONFIRM_HOURS || '48');
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;

async function writeAudit(action, details) {
  await docClient.send({
    TableName: AUDIT_TABLE,
    Item: {
      id: crypto.randomUUID(),
      action,
      details,
      userId: 'system:auto-confirm',
      timestamp: new Date().toISOString(),
      ttl: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60),
    },
  });
}

exports.handler = async (event) => {
  console.log('Auto-confirm check started:', new Date().toISOString());

  try {
    // Find all matchups with 'score_submitted' status
    const pendingMatchups = await docClient.send(new QueryCommand({
      TableName: MATCHUPS_TABLE,
      IndexName: 'status-index',
      KeyConditionExpression: '#status = :status',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':status': 'score_submitted' },
    }));

    const now = new Date();
    let autoConfirmed = 0;
    let notified = 0;

    for (const matchup of (pendingMatchups.Items || [])) {
      // Find the token for this matchup
      const tokens = await docClient.send(new QueryCommand({
        TableName: TOKENS_TABLE,
        IndexName: 'matchupId-index',
        KeyConditionExpression: 'matchupId = :matchupId',
        ExpressionAttributeValues: { ':matchupId': matchup.id },
      }));

      const activeToken = (tokens.Items || []).find(t => !t.used);
      
      if (!activeToken) {
        // No token found - might have been manually confirmed or error
        console.log(`No active token for matchup ${matchup.id}`);
        continue;
      }

      const expiresAt = new Date(activeToken.expiresAt);
      const hoursSinceSubmission = (now - new Date(matchup.updatedAt || matchup.createdAt)) / (1000 * 60 * 60);

      // Check if past auto-confirm threshold
      if (hoursSinceSubmission >= AUTO_CONFIRM_HOURS) {
        console.log(`Auto-confirming matchup ${matchup.id} (submitted ${hoursSinceSubmission.toFixed(1)}h ago)`);

        // Auto-confirm the matchup
        await docClient.send(new UpdateCommand({
          TableName: MATCHUPS_TABLE,
          Key: { id: matchup.id },
          UpdateExpression: 'SET #status = :status, confirmedBy = :confirmedBy',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: {
            ':status': 'confirmed',
            ':confirmedBy': 'system:auto-confirm',
          },
        }));

        // Mark token as used
        await docClient.send(new UpdateCommand({
          TableName: TOKENS_TABLE,
          Key: { token: activeToken.token },
          UpdateExpression: 'SET used = :used',
          ExpressionAttributeValues: { ':used': true },
        }));

        await writeAudit('auto_confirm', `Matchup ${matchup.id} auto-confirmed after ${AUTO_CONFIRM_HOURS}h without response`);
        autoConfirmed++;

        // Send notification
        if (SNS_TOPIC_ARN) {
          try {
            await snsClient.send(new PublishCommand({
              TopicArn: SNS_TOPIC_ARN,
              Message: JSON.stringify({
                type: 'auto_confirm',
                matchupId: matchup.id,
                homeTeamId: matchup.homeTeamId,
                awayTeamId: matchup.awayTeamId,
                weekNumber: matchup.weekNumber,
                message: `Scores for Week ${matchup.weekNumber} match were auto-confirmed after ${AUTO_CONFIRM_HOURS} hours without response.`,
              }),
              Subject: `🥒 Auto-confirmed: Week ${matchup.weekNumber} scores`,
            }));
            notified++;
          } catch (err) {
            console.error('Failed to send notification:', err);
          }
        }
      } else {
        // Send reminder if approaching deadline
        const hoursUntilExpiry = AUTO_CONFIRM_HOURS - hoursSinceSubmission;
        if (hoursUntilExpiry <= 6 && hoursUntilExpiry > 5) {
          // Send reminder at ~6 hours before expiry
          if (SNS_TOPIC_ARN) {
            try {
              await snsClient.send(new PublishCommand({
                TopicArn: SNS_TOPIC_ARN,
                Message: JSON.stringify({
                  type: 'confirmation_reminder',
                  matchupId: matchup.id,
                  hoursRemaining: Math.round(hoursUntilExpiry),
                  message: `Reminder: Scores for Week ${matchup.weekNumber} match need confirmation within ${Math.round(hoursUntilExpiry)} hours.`,
                }),
                Subject: `⏰ Reminder: Confirm Week ${matchup.weekNumber} scores`,
              }));
            } catch (err) {
              console.error('Failed to send reminder:', err);
            }
          }
        }
      }
    }

    console.log(`Auto-confirm check complete: ${autoConfirmed} confirmed, ${notified} notifications sent`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        checked: (pendingMatchups.Items || []).length,
        autoConfirmed,
        notified,
        timestamp: now.toISOString(),
      }),
    };
  } catch (error) {
    console.error('Auto-confirm error:', error);
    throw error;
  }
};
