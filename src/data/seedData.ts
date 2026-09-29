import { Player, Team, Matchup } from '../types';

export const seedTeams: Team[] = [
  { id: 't1', name: 'Smash Masters', color: '#3B82F6', wins: 3, losses: 1, pointsFor: 148, pointsAgainst: 112 },
  { id: 't2', name: 'Dink Dynasties', color: '#10B981', wins: 2, losses: 2, pointsFor: 130, pointsAgainst: 135 },
  { id: 't3', name: 'Kitchen Killers', color: '#F59E0B', wins: 4, losses: 0, pointsFor: 160, pointsAgainst: 95 },
  { id: 't4', name: 'Net Ninjas', color: '#EF4444', wins: 1, losses: 3, pointsFor: 105, pointsAgainst: 150 },
  { id: 't5', name: 'Paddle Pals', color: '#8B5CF6', wins: 2, losses: 2, pointsFor: 125, pointsAgainst: 128 },
  { id: 't6', name: 'Volley Vipers', color: '#EC4899', wins: 0, losses: 4, pointsFor: 98, pointsAgainst: 146 },
];

export const seedPlayers: Player[] = [
  { id: 'p1', name: 'Alex Johnson', email: 'alex@email.com', phone: '555-0101', teamId: 't1', rating: 1520, wins: 8, losses: 2, avatar: '🏓' },
  { id: 'p2', name: 'Sam Rivera', email: 'sam@email.com', phone: '555-0102', teamId: 't1', rating: 1480, wins: 7, losses: 3, avatar: '🎾' },
  { id: 'p3', name: 'Jordan Lee', email: 'jordan@email.com', phone: '555-0103', teamId: 't1', rating: 1440, wins: 6, losses: 4, avatar: '⚡' },
  { id: 'p4', name: 'Casey Kim', email: 'casey@email.com', phone: '555-0104', teamId: 't1', rating: 1410, wins: 5, losses: 5, avatar: '🌟' },
  { id: 'p5', name: 'Morgan Chen', email: 'morgan@email.com', phone: '555-0105', teamId: 't2', rating: 1500, wins: 7, losses: 3, avatar: '🔥' },
  { id: 'p6', name: 'Taylor Swift', email: 'taylor@email.com', phone: '555-0106', teamId: 't2', rating: 1460, wins: 6, losses: 4, avatar: '💫' },
  { id: 'p7', name: 'Riley Park', email: 'riley@email.com', phone: '555-0107', teamId: 't2', rating: 1420, wins: 5, losses: 5, avatar: '🎯' },
  { id: 'p8', name: 'Drew Martinez', email: 'drew@email.com', phone: '555-0108', teamId: 't2', rating: 1380, wins: 4, losses: 6, avatar: '🏆' },
  { id: 'p9', name: 'Quinn Adams', email: 'quinn@email.com', phone: '555-0109', teamId: 't3', rating: 1550, wins: 9, losses: 1, avatar: '👑' },
  { id: 'p10', name: 'Avery Wilson', email: 'avery@email.com', phone: '555-0110', teamId: 't3', rating: 1510, wins: 8, losses: 2, avatar: '💎' },
  { id: 'p11', name: 'Blake Thompson', email: 'blake@email.com', phone: '555-0111', teamId: 't3', rating: 1470, wins: 7, losses: 3, avatar: '🚀' },
  { id: 'p12', name: 'Cameron Davis', email: 'cameron@email.com', phone: '555-0112', teamId: 't3', rating: 1450, wins: 6, losses: 4, avatar: '🎪' },
  { id: 'p13', name: 'Dakota Brown', email: 'dakota@email.com', phone: '555-0113', teamId: 't4', rating: 1390, wins: 4, losses: 6, avatar: '🌊' },
  { id: 'p14', name: 'Emery Garcia', email: 'emery@email.com', phone: '555-0114', teamId: 't4', rating: 1360, wins: 3, losses: 7, avatar: '🎸' },
  { id: 'p15', name: 'Finley White', email: 'finley@email.com', phone: '555-0115', teamId: 't4', rating: 1340, wins: 3, losses: 7, avatar: '🌈' },
  { id: 'p16', name: 'Harper Jones', email: 'harper@email.com', phone: '555-0116', teamId: 't4', rating: 1320, wins: 2, losses: 8, avatar: '🎭' },
  { id: 'p17', name: 'Sage Miller', email: 'sage@email.com', phone: '555-0117', teamId: 't5', rating: 1470, wins: 7, losses: 3, avatar: '🍀' },
  { id: 'p18', name: 'Rowan Taylor', email: 'rowan@email.com', phone: '555-0118', teamId: 't5', rating: 1440, wins: 6, losses: 4, avatar: '🦋' },
  { id: 'p19', name: 'Phoenix Clark', email: 'phoenix@email.com', phone: '555-0119', teamId: 't5', rating: 1400, wins: 5, losses: 5, avatar: '🔮' },
  { id: 'p20', name: 'Reese Hall', email: 'reese@email.com', phone: '555-0120', teamId: 't5', rating: 1370, wins: 4, losses: 6, avatar: '🌺' },
  { id: 'p21', name: 'Skyler Young', email: 'skyler@email.com', phone: '555-0121', teamId: 't6', rating: 1350, wins: 3, losses: 7, avatar: '🌙' },
  { id: 'p22', name: 'Tatum King', email: 'tatum@email.com', phone: '555-0122', teamId: 't6', rating: 1330, wins: 2, losses: 8, avatar: '⭐' },
  { id: 'p23', name: 'Val Scott', email: 'val@email.com', phone: '555-0123', teamId: 't6', rating: 1310, wins: 2, losses: 8, avatar: '🎵' },
  { id: 'p24', name: 'Wren Lopez', email: 'wren@email.com', phone: '555-0124', teamId: 't6', rating: 1290, wins: 1, losses: 9, avatar: '🦅' },
];

export const seedMatchups: Matchup[] = [
  {
    id: 'm1', weekNumber: 1, homeTeamId: 't1', awayTeamId: 't2', status: 'confirmed',
    courtLocation: 'Court 1', scheduledTime: '2026-01-06T18:00',
    submittedBy: 'p1', confirmedBy: 'p5', disputeNote: null,
    games: [
      { id: 'g1', matchupId: 'm1', homePlayer1Id: 'p1', homePlayer2Id: 'p2', awayPlayer1Id: 'p5', awayPlayer2Id: 'p6', homeScore: 11, awayScore: 7 },
      { id: 'g2', matchupId: 'm1', homePlayer1Id: 'p3', homePlayer2Id: 'p4', awayPlayer1Id: 'p7', awayPlayer2Id: 'p8', homeScore: 11, awayScore: 9 },
    ]
  },
  {
    id: 'm2', weekNumber: 1, homeTeamId: 't3', awayTeamId: 't4', status: 'confirmed',
    courtLocation: 'Court 2', scheduledTime: '2026-01-06T18:00',
    submittedBy: 'p9', confirmedBy: 'p13', disputeNote: null,
    games: [
      { id: 'g3', matchupId: 'm2', homePlayer1Id: 'p9', homePlayer2Id: 'p10', awayPlayer1Id: 'p13', awayPlayer2Id: 'p14', homeScore: 11, awayScore: 4 },
      { id: 'g4', matchupId: 'm2', homePlayer1Id: 'p11', homePlayer2Id: 'p12', awayPlayer1Id: 'p15', awayPlayer2Id: 'p16', homeScore: 11, awayScore: 6 },
    ]
  },
  {
    id: 'm3', weekNumber: 1, homeTeamId: 't5', awayTeamId: 't6', status: 'confirmed',
    courtLocation: 'Court 3', scheduledTime: '2026-01-06T18:00',
    submittedBy: 'p17', confirmedBy: 'p21', disputeNote: null,
    games: [
      { id: 'g5', matchupId: 'm3', homePlayer1Id: 'p17', homePlayer2Id: 'p18', awayPlayer1Id: 'p21', awayPlayer2Id: 'p22', homeScore: 11, awayScore: 8 },
      { id: 'g6', matchupId: 'm3', homePlayer1Id: 'p19', homePlayer2Id: 'p20', awayPlayer1Id: 'p23', awayPlayer2Id: 'p24', homeScore: 11, awayScore: 5 },
    ]
  },
  {
    id: 'm4', weekNumber: 2, homeTeamId: 't1', awayTeamId: 't3', status: 'confirmed',
    courtLocation: 'Court 1', scheduledTime: '2026-01-13T18:00',
    submittedBy: 'p1', confirmedBy: 'p9', disputeNote: null,
    games: [
      { id: 'g7', matchupId: 'm4', homePlayer1Id: 'p1', homePlayer2Id: 'p3', awayPlayer1Id: 'p9', awayPlayer2Id: 'p11', homeScore: 9, awayScore: 11 },
      { id: 'g8', matchupId: 'm4', homePlayer1Id: 'p2', homePlayer2Id: 'p4', awayPlayer1Id: 'p10', awayPlayer2Id: 'p12', homeScore: 11, awayScore: 8 },
    ]
  },
  {
    id: 'm5', weekNumber: 2, homeTeamId: 't2', awayTeamId: 't5', status: 'confirmed',
    courtLocation: 'Court 2', scheduledTime: '2026-01-13T18:00',
    submittedBy: 'p5', confirmedBy: 'p17', disputeNote: null,
    games: [
      { id: 'g9', matchupId: 'm5', homePlayer1Id: 'p5', homePlayer2Id: 'p7', awayPlayer1Id: 'p17', awayPlayer2Id: 'p19', homeScore: 11, awayScore: 6 },
      { id: 'g10', matchupId: 'm5', homePlayer1Id: 'p6', homePlayer2Id: 'p8', awayPlayer1Id: 'p18', awayPlayer2Id: 'p20', homeScore: 8, awayScore: 11 },
    ]
  },
  {
    id: 'm6', weekNumber: 2, homeTeamId: 't4', awayTeamId: 't6', status: 'confirmed',
    courtLocation: 'Court 3', scheduledTime: '2026-01-13T18:00',
    submittedBy: 'p13', confirmedBy: 'p21', disputeNote: null,
    games: [
      { id: 'g11', matchupId: 'm6', homePlayer1Id: 'p13', homePlayer2Id: 'p15', awayPlayer1Id: 'p21', awayPlayer2Id: 'p23', homeScore: 11, awayScore: 9 },
      { id: 'g12', matchupId: 'm6', homePlayer1Id: 'p14', homePlayer2Id: 'p16', awayPlayer1Id: 'p22', awayPlayer2Id: 'p24', homeScore: 11, awayScore: 7 },
    ]
  },
  {
    id: 'm7', weekNumber: 3, homeTeamId: 't1', awayTeamId: 't5', status: 'confirmed',
    courtLocation: 'Court 1', scheduledTime: '2026-01-20T18:00',
    submittedBy: 'p2', confirmedBy: 'p18', disputeNote: null,
    games: [
      { id: 'g13', matchupId: 'm7', homePlayer1Id: 'p1', homePlayer2Id: 'p4', awayPlayer1Id: 'p17', awayPlayer2Id: 'p20', homeScore: 11, awayScore: 9 },
      { id: 'g14', matchupId: 'm7', homePlayer1Id: 'p2', homePlayer2Id: 'p3', awayPlayer1Id: 'p18', awayPlayer2Id: 'p19', homeScore: 11, awayScore: 7 },
    ]
  },
  {
    id: 'm8', weekNumber: 3, homeTeamId: 't3', awayTeamId: 't6', status: 'confirmed',
    courtLocation: 'Court 2', scheduledTime: '2026-01-20T18:00',
    submittedBy: 'p10', confirmedBy: 'p22', disputeNote: null,
    games: [
      { id: 'g15', matchupId: 'm8', homePlayer1Id: 'p9', homePlayer2Id: 'p12', awayPlayer1Id: 'p21', awayPlayer2Id: 'p24', homeScore: 11, awayScore: 3 },
      { id: 'g16', matchupId: 'm8', homePlayer1Id: 'p10', homePlayer2Id: 'p11', awayPlayer1Id: 'p22', awayPlayer2Id: 'p23', homeScore: 11, awayScore: 5 },
    ]
  },
  {
    id: 'm9', weekNumber: 3, homeTeamId: 't2', awayTeamId: 't4', status: 'confirmed',
    courtLocation: 'Court 3', scheduledTime: '2026-01-20T18:00',
    submittedBy: 'p6', confirmedBy: 'p14', disputeNote: null,
    games: [
      { id: 'g17', matchupId: 'm9', homePlayer1Id: 'p5', homePlayer2Id: 'p8', awayPlayer1Id: 'p13', awayPlayer2Id: 'p16', homeScore: 11, awayScore: 8 },
      { id: 'g18', matchupId: 'm9', homePlayer1Id: 'p6', homePlayer2Id: 'p7', awayPlayer1Id: 'p14', awayPlayer2Id: 'p15', homeScore: 9, awayScore: 11 },
    ]
  },
  {
    id: 'm10', weekNumber: 4, homeTeamId: 't2', awayTeamId: 't3', status: 'score_submitted',
    courtLocation: 'Court 1', scheduledTime: '2026-01-27T18:00',
    submittedBy: 'p5', confirmedBy: null, disputeNote: null,
    games: [
      { id: 'g19', matchupId: 'm10', homePlayer1Id: 'p5', homePlayer2Id: 'p6', awayPlayer1Id: 'p9', awayPlayer2Id: 'p10', homeScore: 8, awayScore: 11 },
      { id: 'g20', matchupId: 'm10', homePlayer1Id: 'p7', homePlayer2Id: 'p8', awayPlayer1Id: 'p11', awayPlayer2Id: 'p12', homeScore: 11, awayScore: 9 },
    ]
  },
  {
    id: 'm11', weekNumber: 4, homeTeamId: 't4', awayTeamId: 't1', status: 'scheduled',
    courtLocation: 'Court 2', scheduledTime: '2026-01-27T18:00',
    submittedBy: null, confirmedBy: null, disputeNote: null,
    games: []
  },
  {
    id: 'm12', weekNumber: 4, homeTeamId: 't6', awayTeamId: 't5', status: 'scheduled',
    courtLocation: 'Court 3', scheduledTime: '2026-01-27T18:00',
    submittedBy: null, confirmedBy: null, disputeNote: null,
    games: []
  },
  {
    id: 'm13', weekNumber: 5, homeTeamId: 't3', awayTeamId: 't1', status: 'scheduled',
    courtLocation: 'Court 1', scheduledTime: '2026-02-03T18:00',
    submittedBy: null, confirmedBy: null, disputeNote: null,
    games: []
  },
  {
    id: 'm14', weekNumber: 5, homeTeamId: 't5', awayTeamId: 't2', status: 'scheduled',
    courtLocation: 'Court 2', scheduledTime: '2026-02-03T18:00',
    submittedBy: null, confirmedBy: null, disputeNote: null,
    games: []
  },
  {
    id: 'm15', weekNumber: 5, homeTeamId: 't6', awayTeamId: 't4', status: 'scheduled',
    courtLocation: 'Court 3', scheduledTime: '2026-02-03T18:00',
    submittedBy: null, confirmedBy: null, disputeNote: null,
    games: []
  },
];
