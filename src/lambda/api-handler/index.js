/**
 * PicklePal API Handler
 * Main Lambda function for all API operations
 * 
 * Environment Variables:
 * - TEAMS_TABLE, PLAYERS_TABLE, MATCHUPS_TABLE, GAMES_TABLE
 * - TOKENS_TABLE, AUDIT_TABLE, SEASONS_TABLE
 * - COGNITO_USER_POOL_ID, SNS_TOPIC_ARN
 * - FRONTEND_URL, AUTO_CONFIRM_HOURS, ENVIRONMENT
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, DeleteCommand, QueryCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const crypto = require('crypto');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const sesClient = new SESClient({});
const snsClient = new SNSClient({});

// Table names from environment
const TABLES = {
  teams: process.env.TEAMS_TABLE,
  players: process.env.PLAYERS_TABLE,
  matchups: process.env.MATCHUPS_TABLE,
  games: process.env.GAMES_TABLE,
  tokens: process.env.TOKENS_TABLE,
  audit: process.env.AUDIT_TABLE,
  seasons: process.env.SEASONS_TABLE,
};

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const AUTO_CONFIRM_HOURS = parseInt(process.env.AUTO_CONFIRM_HOURS || '48');

// ============================================================
// HELPERS
// ============================================================

function generateId() {
  return crypto.randomUUID();
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Max-Age': '86400',
  };
}

function response(statusCode, body) {
  return {
    statusCode,
    headers: corsHeaders(),
    body: JSON.stringify(body),
  };
}

async function writeAudit(action, details, userId = 'system') {
  await docClient.send(new PutCommand({
    TableName: TABLES.audit,
    Item: {
      id: generateId(),
      action,
      details,
      userId,
      timestamp: new Date().toISOString(),
      ttl: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60), // 90 days
    },
  }));
}

async function sendConfirmationEmail(toEmail, toName, matchup, token) {
  const confirmUrl = `${FRONTEND_URL}/#/matchups/${matchup.id}/confirm?token=${token}`;
  
  const command = new SendEmailCommand({
    Destination: { ToAddresses: [toEmail] },
    Message: {
      Subject: { Data: `🥒 PicklePal: Scores submitted for your match - Please confirm` },
      Body: {
        Html: {
          Data: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #059669, #0d9488); padding: 20px; border-radius: 12px 12px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">🥒 PicklePal</h1>
              </div>
              <div style="padding: 24px; background: #f9fafb; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
                <p style="font-size: 16px; color: #111827;">Hi ${toName},</p>
                <p style="font-size: 14px; color: #374151;">Scores have been submitted for your match:</p>
                <div style="background: white; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #e5e7eb;">
                  <p style="font-size: 18px; font-weight: bold; color: #111827; margin: 0;">
                    ${matchup.homeTeamName} vs ${matchup.awayTeamName}
                  </p>
                  <p style="font-size: 12px; color: #6b7280; margin: 4px 0 0;">Week ${matchup.weekNumber}</p>
                </div>
                <p style="font-size: 14px; color: #374151;">Please review and confirm the scores, or dispute them if there's an issue.</p>
                <a href="${confirmUrl}" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
                  Review & Confirm Scores →
                </a>
                <p style="font-size: 12px; color: #9ca3af; margin-top: 24px;">
                  This link expires in ${AUTO_CONFIRM_HOURS} hours. If not confirmed, scores will auto-confirm.
                </p>
              </div>
            </div>
          `,
        },
        Text: {
          Data: `Hi ${toName},\n\nScores have been submitted for your match: ${matchup.homeTeamName} vs ${matchup.awayTeamName} (Week ${matchup.weekNumber}).\n\nPlease review and confirm: ${confirmUrl}\n\nThis link expires in ${AUTO_CONFIRM_HOURS} hours.`,
        },
      },
    },
    Source: 'no-reply@picklepal.app',
  });

  await sesClient.send(command);
}

async function sendNotification(message) {
  await snsClient.send(new PublishCommand({
    TopicArn: process.env.SNS_TOPIC_ARN,
    Message: JSON.stringify(message),
    Subject: 'PicklePal Notification',
  }));
}

// ============================================================
// ROUTE HANDLERS
// ============================================================

async function handleTeams(method, pathParams, body) {
  switch (method) {
    case 'GET':
      if (pathParams.id) {
        const result = await docClient.send(new GetCommand({ TableName: TABLES.teams, Key: { id: pathParams.id } }));
        if (!result.Item) return response(404, { error: 'Team not found' });
        return response(200, result.Item);
      }
      const teams = await docClient.send(new ScanCommand({ TableName: TABLES.teams }));
      return response(200, teams.Items || []);

    case 'POST':
      const newTeam = {
        id: generateId(),
        name: body.name,
        color: body.color || '#3B82F6',
        wins: 0,
        losses: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        createdAt: new Date().toISOString(),
      };
      await docClient.send(new PutCommand({ TableName: TABLES.teams, Item: newTeam }));
      await writeAudit('create_team', `Team "${newTeam.name}" created`);
      return response(201, newTeam);

    case 'PUT':
      if (!pathParams.id) return response(400, { error: 'Team ID required' });
      const existing = await docClient.send(new GetCommand({ TableName: TABLES.teams, Key: { id: pathParams.id } }));
      if (!existing.Item) return response(404, { error: 'Team not found' });
      const updated = { ...existing.Item, ...body, id: pathParams.id };
      await docClient.send(new PutCommand({ TableName: TABLES.teams, Item: updated }));
      await writeAudit('update_team', `Team "${updated.name}" updated`);
      return response(200, updated);

    case 'DELETE':
      if (!pathParams.id) return response(400, { error: 'Team ID required' });
      await docClient.send(new DeleteCommand({ TableName: TABLES.teams, Key: { id: pathParams.id } }));
      await writeAudit('delete_team', `Team ${pathParams.id} deleted`);
      return response(200, { message: 'Team deleted' });

    default:
      return response(405, { error: 'Method not allowed' });
  }
}

async function handlePlayers(method, pathParams, body, queryParams) {
  switch (method) {
    case 'GET':
      if (pathParams.id) {
        const result = await docClient.send(new GetCommand({ TableName: TABLES.players, Key: { id: pathParams.id } }));
        if (!result.Item) return response(404, { error: 'Player not found' });
        return response(200, result.Item);
      }
      if (queryParams?.teamId) {
        const result = await docClient.send(new QueryCommand({
          TableName: TABLES.players,
          IndexName: 'teamId-index',
          KeyConditionExpression: 'teamId = :teamId',
          ExpressionAttributeValues: { ':teamId': queryParams.teamId },
        }));
        return response(200, result.Items || []);
      }
      const players = await docClient.send(new ScanCommand({ TableName: TABLES.players }));
      return response(200, players.Items || []);

    case 'POST':
      const newPlayer = {
        id: generateId(),
        name: body.name,
        email: body.email,
        phone: body.phone || '',
        teamId: body.teamId || null,
        rating: body.rating || 1200,
        wins: 0,
        losses: 0,
        avatar: body.avatar || '🏓',
        createdAt: new Date().toISOString(),
      };
      await docClient.send(new PutCommand({ TableName: TABLES.players, Item: newPlayer }));
      await writeAudit('create_player', `Player "${newPlayer.name}" added`);
      return response(201, newPlayer);

    case 'PUT':
      if (!pathParams.id) return response(400, { error: 'Player ID required' });
      const existing = await docClient.send(new GetCommand({ TableName: TABLES.players, Key: { id: pathParams.id } }));
      if (!existing.Item) return response(404, { error: 'Player not found' });
      const updated = { ...existing.Item, ...body, id: pathParams.id };
      await docClient.send(new PutCommand({ TableName: TABLES.players, Item: updated }));
      await writeAudit('update_player', `Player "${updated.name}" updated`);
      return response(200, updated);

    case 'DELETE':
      if (!pathParams.id) return response(400, { error: 'Player ID required' });
      await docClient.send(new DeleteCommand({ TableName: TABLES.players, Key: { id: pathParams.id } }));
      await writeAudit('delete_player', `Player ${pathParams.id} removed`);
      return response(200, { message: 'Player deleted' });

    default:
      return response(405, { error: 'Method not allowed' });
  }
}

async function handleMatchups(method, pathParams, body, queryParams) {
  switch (method) {
    case 'GET':
      if (pathParams.id) {
        const result = await docClient.send(new GetCommand({ TableName: TABLES.matchups, Key: { id: pathParams.id } }));
        if (!result.Item) return response(404, { error: 'Matchup not found' });
        // Fetch associated games
        const games = await docClient.send(new QueryCommand({
          TableName: TABLES.games,
          IndexName: 'matchupId-index',
          KeyConditionExpression: 'matchupId = :matchupId',
          ExpressionAttributeValues: { ':matchupId': pathParams.id },
        }));
        return response(200, { ...result.Item, games: games.Items || [] });
      }
      if (queryParams?.weekNumber) {
        const result = await docClient.send(new QueryCommand({
          TableName: TABLES.matchups,
          IndexName: 'weekNumber-index',
          KeyConditionExpression: 'weekNumber = :week',
          ExpressionAttributeValues: { ':week': parseInt(queryParams.weekNumber) },
        }));
        return response(200, result.Items || []);
      }
      const matchups = await docClient.send(new ScanCommand({ TableName: TABLES.matchups }));
      return response(200, matchups.Items || []);

    case 'POST':
      const newMatchup = {
        id: generateId(),
        weekNumber: body.weekNumber,
        homeTeamId: body.homeTeamId,
        awayTeamId: body.awayTeamId,
        status: 'scheduled',
        courtLocation: body.courtLocation || 'TBD',
        scheduledTime: body.scheduledTime,
        submittedBy: null,
        confirmedBy: null,
        disputeNote: null,
        createdAt: new Date().toISOString(),
      };
      await docClient.send(new PutCommand({ TableName: TABLES.matchups, Item: newMatchup }));
      await writeAudit('create_matchup', `Matchup created for week ${newMatchup.weekNumber}`);
      return response(201, newMatchup);

    case 'PUT':
      if (!pathParams.id) return response(400, { error: 'Matchup ID required' });
      const existing = await docClient.send(new GetCommand({ TableName: TABLES.matchups, Key: { id: pathParams.id } }));
      if (!existing.Item) return response(404, { error: 'Matchup not found' });
      const updated = { ...existing.Item, ...body, id: pathParams.id };
      await docClient.send(new PutCommand({ TableName: TABLES.matchups, Item: updated }));
      return response(200, updated);

    default:
      return response(405, { error: 'Method not allowed' });
  }
}

async function handleSubmitScores(matchupId, body, userId) {
  // Get matchup
  const matchupResult = await docClient.send(new GetCommand({ TableName: TABLES.matchups, Key: { id: matchupId } }));
  if (!matchupResult.Item) return response(404, { error: 'Matchup not found' });
  const matchup = matchupResult.Item;

  // Save games
  const games = body.games.map(game => ({
    id: generateId(),
    matchupId,
    homePlayer1Id: game.homePlayer1Id,
    homePlayer2Id: game.homePlayer2Id,
    awayPlayer1Id: game.awayPlayer1Id,
    awayPlayer2Id: game.awayPlayer2Id,
    homeScore: game.homeScore,
    awayScore: game.awayScore,
  }));

  // Batch write games
  for (const game of games) {
    await docClient.send(new PutCommand({ TableName: TABLES.games, Item: game }));
  }

  // Update matchup status
  await docClient.send(new UpdateCommand({
    TableName: TABLES.matchups,
    Key: { id: matchupId },
    UpdateExpression: 'SET #status = :status, submittedBy = :submittedBy, games = :games',
    ExpressionAttributeNames: { '#status': 'status' },
    ExpressionAttributeValues: {
      ':status': 'score_submitted',
      ':submittedBy': userId,
      ':games': games,
    },
  }));

  // Generate confirmation token
  const token = generateToken();
  const expiresAt = new Date(Date.now() + AUTO_CONFIRM_HOURS * 60 * 60 * 1000).toISOString();
  
  await docClient.send(new PutCommand({
    TableName: TABLES.tokens,
    Item: {
      token,
      matchupId,
      expiresAt,
      used: false,
      ttl: Math.floor(Date.now() / 1000) + (AUTO_CONFIRM_HOURS + 24) * 60 * 60, // extra 24h buffer
    },
  }));

  // Send confirmation email to opposing team captain
  // In production, look up the opposing team's captain email
  try {
    await sendConfirmationEmail(
      'opposing-captain@example.com', // Replace with actual lookup
      'Captain',
      { ...matchup, homeTeamName: 'Home Team', awayTeamName: 'Away Team' },
      token
    );
  } catch (err) {
    console.error('Failed to send confirmation email:', err);
    // Don't fail the request if email fails
  }

  await writeAudit('submit_scores', `Scores submitted for matchup ${matchupId}`, userId);

  return response(200, {
    message: 'Scores submitted successfully',
    matchupId,
    token,
    expiresAt,
  });
}

async function handleConfirmScore(token, body) {
  // Look up token
  const tokenResult = await docClient.send(new GetCommand({ TableName: TABLES.tokens, Key: { token } }));
  if (!tokenResult.Item) return response(404, { error: 'Invalid or expired token' });
  if (tokenResult.Item.used) return response(400, { error: 'Token already used' });
  if (new Date(tokenResult.Item.expiresAt) < new Date()) return response(400, { error: 'Token expired' });

  const matchupId = tokenResult.Item.matchupId;

  // Get matchup
  const matchupResult = await docClient.send(new GetCommand({ TableName: TABLES.matchups, Key: { id: matchupId } }));
  if (!matchupResult.Item) return response(404, { error: 'Matchup not found' });

  const action = body?.action || 'confirm'; // 'confirm' or 'dispute'

  if (action === 'dispute') {
    await docClient.send(new UpdateCommand({
      TableName: TABLES.matchups,
      Key: { id: matchupId },
      UpdateExpression: 'SET #status = :status, disputeNote = :note',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':status': 'disputed',
        ':note': body.note || 'No reason provided',
      },
    }));
    await writeAudit('dispute_scores', `Scores disputed for matchup ${matchupId}: ${body.note}`);
  } else {
    await docClient.send(new UpdateCommand({
      TableName: TABLES.matchups,
      Key: { id: matchupId },
      UpdateExpression: 'SET #status = :status, confirmedBy = :confirmedBy',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':status': 'confirmed',
        ':confirmedBy': 'token_confirmation',
      },
    }));
    await writeAudit('confirm_scores', `Scores confirmed for matchup ${matchupId}`);
  }

  // Mark token as used
  await docClient.send(new UpdateCommand({
    TableName: TABLES.tokens,
    Key: { token },
    UpdateExpression: 'SET used = :used',
    ExpressionAttributeValues: { ':used': true },
  }));

  return response(200, {
    message: action === 'dispute' ? 'Score disputed successfully' : 'Score confirmed successfully',
    matchupId,
    action,
  });
}

async function handleRankings() {
  // Get all teams and compute standings
  const teamsResult = await docClient.send(new ScanCommand({ TableName: TABLES.teams }));
  const matchupsResult = await docClient.send(new ScanCommand({ TableName: TABLES.matchups }));
  const playersResult = await docClient.send(new ScanCommand({ TableName: TABLES.players }));

  const confirmedMatchups = (matchupsResult.Items || []).filter(m => m.status === 'confirmed');
  const teams = (teamsResult.Items || []).map(team => {
    const teamMatchups = confirmedMatchups.filter(m => m.homeTeamId === team.id || m.awayTeamId === team.id);
    let wins = 0, losses = 0, pointsFor = 0, pointsAgainst = 0;

    teamMatchups.forEach(m => {
      let teamScore = 0, oppScore = 0;
      (m.games || []).forEach(g => {
        if (m.homeTeamId === team.id) {
          teamScore += g.homeScore || 0;
          oppScore += g.awayScore || 0;
        } else {
          teamScore += g.awayScore || 0;
          oppScore += g.homeScore || 0;
        }
      });
      pointsFor += teamScore;
      pointsAgainst += oppScore;
      if (teamScore > oppScore) wins++;
      else losses++;
    });

    return { ...team, wins, losses, pointsFor, pointsAgainst, pointDiff: pointsFor - pointsAgainst };
  }).sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    return b.pointDiff - a.pointDiff;
  });

  const players = (playersResult.Items || []).sort((a, b) => b.rating - a.rating);

  return response(200, { teams, players });
}

// ============================================================
// MAIN HANDLER
// ============================================================

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return response(200, {});
  }

  try {
    const method = event.httpMethod;
    const path = event.path || event.requestContext?.http?.path || '/';
    const pathParts = path.replace(/^\//, '').split('/');
    const body = event.body ? JSON.parse(event.body) : {};
    const queryParams = event.queryStringParameters || {};

    // Route: /confirm/{token}
    if (pathParts[0] === 'confirm' && pathParts[1]) {
      if (method === 'GET') {
        // Return matchup details for the token
        const tokenResult = await docClient.send(new GetCommand({ TableName: TABLES.tokens, Key: { token: pathParts[1] } }));
        if (!tokenResult.Item) return response(404, { error: 'Invalid token' });
        const matchupResult = await docClient.send(new GetCommand({ TableName: TABLES.matchups, Key: { id: tokenResult.Item.matchupId } }));
        return response(200, { matchup: matchupResult.Item, token: tokenResult.Item });
      }
      if (method === 'POST') {
        return await handleConfirmScore(pathParts[1], body);
      }
    }

    // Route: /rankings
    if (pathParts[0] === 'rankings') {
      return await handleRankings();
    }

    // Route: /matchups/{id}/scores
    if (pathParts[0] === 'matchups' && pathParts[2] === 'scores') {
      if (method === 'POST') {
        const userId = event.requestContext?.authorizer?.claims?.sub || body.submittedBy || 'anonymous';
        return await handleSubmitScores(pathParts[1], body, userId);
      }
    }

    // Route: /teams or /teams/{id}
    if (pathParts[0] === 'teams') {
      return await handleTeams(method, { id: pathParts[1] }, body, queryParams);
    }

    // Route: /players or /players/{id}
    if (pathParts[0] === 'players') {
      return await handlePlayers(method, { id: pathParts[1] }, body, queryParams);
    }

    // Route: /matchups or /matchups/{id}
    if (pathParts[0] === 'matchups') {
      return await handleMatchups(method, { id: pathParts[1] }, body, queryParams);
    }

    // Route: / (health check)
    if (path === '/' || path === '') {
      return response(200, {
        service: 'PicklePal API',
        version: '1.0.0',
        environment: process.env.ENVIRONMENT,
        timestamp: new Date().toISOString(),
      });
    }

    return response(404, { error: 'Route not found', path });
  } catch (error) {
    console.error('Handler error:', error);
    return response(500, {
      error: 'Internal server error',
      message: error.message,
    });
  }
};
