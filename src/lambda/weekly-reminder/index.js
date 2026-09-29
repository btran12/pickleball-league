/**
 * PicklePal Weekly Reminder Handler
 * Triggered by EventBridge every Monday at 9 AM
 * Sends reminders to team captains about upcoming matches
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, ScanCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const sesClient = new SESClient({});
const snsClient = new SNSClient({});

const MATCHUPS_TABLE = process.env.MATCHUPS_TABLE;
const TEAMS_TABLE = process.env.TEAMS_TABLE;
const PLAYERS_TABLE = process.env.PLAYERS_TABLE;
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

async function getTeamPlayers(teamId) {
  const result = await docClient.send(new QueryCommand({
    TableName: PLAYERS_TABLE,
    IndexName: 'teamId-index',
    KeyConditionExpression: 'teamId = :teamId',
    ExpressionAttributeValues: { ':teamId': teamId },
  }));
  return result.Items || [];
}

async function sendMatchReminder(teamName, players, matchup, isHome) {
  const opponentResult = await docClient.send(new GetCommand({
    TableName: TEAMS_TABLE,
    Key: { id: isHome ? matchup.awayTeamId : matchup.homeTeamId },
  }));
  const opponentName = opponentResult.Item?.name || 'Opponent';
  const matchTime = new Date(matchup.scheduledTime);
  const formattedDate = matchTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const formattedTime = matchTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  for (const player of players) {
    if (!player.email) continue;

    try {
      await sesClient.send(new SendEmailCommand({
        Destination: { ToAddresses: [player.email] },
        Message: {
          Subject: { Data: `🥒 PicklePal: Match reminder - ${teamName} vs ${opponentName}` },
          Body: {
            Html: {
              Data: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
                  <div style="background: linear-gradient(135deg, #059669, #0d9488); padding: 20px; border-radius: 12px 12px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">🥒 Match Reminder</h1>
                  </div>
                  <div style="padding: 24px; background: #f9fafb; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
                    <p style="font-size: 16px; color: #111827;">Hi ${player.name},</p>
                    <p style="font-size: 14px; color: #374151;">You have an upcoming match this week:</p>
                    <div style="background: white; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #e5e7eb;">
                      <p style="font-size: 18px; font-weight: bold; color: #111827; margin: 0;">
                        ${teamName} vs ${opponentName}
                      </p>
                      <p style="font-size: 14px; color: #6b7280; margin: 8px 0 0;">
                        📅 ${formattedDate} at ${formattedTime}<br>
                        📍 ${matchup.courtLocation || 'TBD'}
                      </p>
                    </div>
                    <p style="font-size: 14px; color: #374151;">Don't forget to enter scores after your match!</p>
                    <a href="${FRONTEND_URL}" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
                      Open PicklePal →
                    </a>
                    <p style="font-size: 12px; color: #9ca3af; margin-top: 16px;">
                      See you on the court! 🏓
                    </p>
                  </div>
                </div>
              `,
            },
            Text: {
              Data: `Hi ${player.name},\n\nYou have a match this week: ${teamName} vs ${opponentName}\n${formattedDate} at ${formattedTime}\n${matchup.courtLocation || 'TBD'}\n\nOpen PicklePal: ${FRONTEND_URL}`,
            },
          },
        },
        Source: 'no-reply@picklepal.app',
      }));
    } catch (err) {
      console.error(`Failed to send reminder to ${player.email}:`, err);
    }
  }
}

exports.handler = async (event) => {
  console.log('Weekly reminder check started:', new Date().toISOString());

  try {
    // Determine current week (you might want to store this in the seasons table)
    const currentWeek = Math.ceil((new Date() - new Date(new Date().getFullYear(), 0, 1)) / (7 * 24 * 60 * 60 * 1000));

    // Get matchups for this week
    const matchupsResult = await docClient.send(new QueryCommand({
      TableName: MATCHUPS_TABLE,
      IndexName: 'weekNumber-index',
      KeyConditionExpression: 'weekNumber = :week',
      ExpressionAttributeValues: { ':week': currentWeek },
    }));

    const matchups = matchupsResult.Items || [];
    let remindersSent = 0;

    for (const matchup of matchups) {
      // Get home team players
      const homePlayers = await getTeamPlayers(matchup.homeTeamId);
      const homeTeam = await docClient.send(new GetCommand({ TableName: TEAMS_TABLE, Key: { id: matchup.homeTeamId } }));
      
      if (homeTeam.Item && homePlayers.length > 0) {
        await sendMatchReminder(homeTeam.Item.name, homePlayers, matchup, true);
        remindersSent += homePlayers.filter(p => p.email).length;
      }

      // Get away team players
      const awayPlayers = await getTeamPlayers(matchup.awayTeamId);
      const awayTeam = await docClient.send(new GetCommand({ TableName: TEAMS_TABLE, Key: { id: matchup.awayTeamId } }));
      
      if (awayTeam.Item && awayPlayers.length > 0) {
        await sendMatchReminder(awayTeam.Item.name, awayPlayers, matchup, false);
        remindersSent += awayPlayers.filter(p => p.email).length;
      }
    }

    // Also send SNS notification for admin
    if (SNS_TOPIC_ARN && matchups.length > 0) {
      await snsClient.send(new PublishCommand({
        TopicArn: SNS_TOPIC_ARN,
        Message: JSON.stringify({
          type: 'weekly_reminder_summary',
          weekNumber: currentWeek,
          matchupsCount: matchups.length,
          remindersSent,
        }),
        Subject: `🥒 Week ${currentWeek} reminders sent (${remindersSent} players notified)`,
      }));
    }

    console.log(`Weekly reminders complete: ${remindersSent} players notified for ${matchups.length} matchups`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        weekNumber: currentWeek,
        matchups: matchups.length,
        remindersSent,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error('Weekly reminder error:', error);
    throw error;
  }
};
