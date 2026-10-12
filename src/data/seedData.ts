import { Player, Team, Matchup } from '../types';

export const seedTeams: Team[] = [];

export const seedPlayers: Player[] = [
  { id: 'p1', name: 'Long Nguyen', email: 'nguyenlongsuzuki@icloud.com', phone: '', teamId: null, rating: 1200, wins: 0, losses: 0, avatar: '🏓' },
  { id: 'p2', name: 'Bao Nguyen', email: 'wamipnguyen@gmail.com', phone: '603-233-9912', teamId: null, rating: 1200, wins: 0, losses: 0, avatar: '🏓' },
  { id: 'p3', name: 'Duy Nguyen', email: 'duyatwork291@gmail.com', phone: '860-659-7555', teamId: null, rating: 1200, wins: 0, losses: 0, avatar: '🏓' },
  { id: 'p4', name: 'Tyler Nguyen', email: 'ngthinh7@gmail.com', phone: '', teamId: null, rating: 1200, wins: 0, losses: 0, avatar: '🏓' },
  { id: 'p5', name: 'Phi Nguyen', email: '2015phin276@gmail.com', phone: '', teamId: null, rating: 1200, wins: 0, losses: 0, avatar: '🏓' },
  { id: 'p6', name: 'Bao Tran', email: 'baotranomatic@gmail.com', phone: '413-626-3714', teamId: null, rating: 1200, wins: 0, losses: 0, avatar: '🏓' },
  { id: 'p7', name: 'Thinh Nguyen', email: 'envodamerchant@gmail.com', phone: '', teamId: null, rating: 1200, wins: 0, losses: 0, avatar: '🏓' },
  { id: 'p8', name: 'Vi Nguyen', email: 'vinguyen9483@gmail.com', phone: '', teamId: null, rating: 1200, wins: 0, losses: 0, avatar: '🏓' },
  { id: 'p9', name: 'Dung Nguyen', email: 'suzukivietlam@gmail.com', phone: '', teamId: null, rating: 1200, wins: 0, losses: 0, avatar: '🏓' },
  { id: 'p10', name: 'Trieu Nguyen', email: 'vinhbay7@gmail.com', phone: '', teamId: null, rating: 1200, wins: 0, losses: 0, avatar: '🏓' },
  { id: 'p11', name: 'Hai Nguyen', email: 'nguyenvisuzuki@gmail.com', phone: '', teamId: null, rating: 1200, wins: 0, losses: 0, avatar: '🏓' },
  { id: 'p12', name: 'Christopher Nguyen', email: 'nguyenchristopher729@gmail.com', phone: '', teamId: null, rating: 1200, wins: 0, losses: 0, avatar: '🏓' },
  { id: 'p13', name: 'Chris Long', email: 'chrislong48@gmail.com', phone: '', teamId: null, rating: 1200, wins: 0, losses: 0, avatar: '🏓' },
  { id: 'p14', name: 'Dien Nguyen', email: 'tunuidien@gmail.com', phone: '', teamId: null, rating: 1200, wins: 0, losses: 0, avatar: '🏓' },
  { id: 'p15', name: 'Ralph Phan', email: 'ralph_phan@yahoo.com', phone: '', teamId: null, rating: 1200, wins: 0, losses: 0, avatar: '🏓' },
  { id: 'p16', name: 'Huy Dang', email: 'huybaodang123@yahoo.com', phone: '', teamId: null, rating: 1200, wins: 0, losses: 0, avatar: '🏓' },
  { id: 'p17', name: 'Hieu Nguyen', email: 'maconguyen@yahoo.com', phone: '', teamId: null, rating: 1200, wins: 0, losses: 0, avatar: '🏓' },
  { id: 'p18', name: 'Bach (Loc) Bang', email: '', phone: '', teamId: null, rating: 1200, wins: 0, losses: 0, avatar: '🏓' },
  { id: 'p19', name: 'Binh Tran', email: '', phone: '', teamId: null, rating: 1200, wins: 0, losses: 0, avatar: '🏓' },
  { id: 'p20', name: 'Chau Hoang', email: '', phone: '', teamId: null, rating: 1200, wins: 0, losses: 0, avatar: '🏓' },
  { id: 'p21', name: 'Cuong Le', email: '', phone: '', teamId: null, rating: 1200, wins: 0, losses: 0, avatar: '🏓' },
  { id: 'p22', name: 'Dean Vu', email: '', phone: '', teamId: null, rating: 1200, wins: 0, losses: 0, avatar: '🏓' },
  { id: 'p23', name: 'Duong Pham', email: '', phone: '', teamId: null, rating: 1200, wins: 0, losses: 0, avatar: '🏓' },
  { id: 'p24', name: 'Kevin Tran', email: '', phone: '', teamId: null, rating: 1200, wins: 0, losses: 0, avatar: '🏓' },
  { id: 'p25', name: 'Kevin Bao', email: '', phone: '', teamId: null, rating: 1200, wins: 0, losses: 0, avatar: '🏓' },
  { id: 'p26', name: 'Lan Ngo', email: '', phone: '', teamId: null, rating: 1200, wins: 0, losses: 0, avatar: '🏓' },
  { id: 'p27', name: 'Nga Vuong', email: '', phone: '', teamId: null, rating: 1200, wins: 0, losses: 0, avatar: '🏓' },
  { id: 'p28', name: 'Son Dang', email: '', phone: '', teamId: null, rating: 1200, wins: 0, losses: 0, avatar: '🏓' },
  { id: 'p29', name: 'Susan Nguyen', email: '', phone: '', teamId: null, rating: 1200, wins: 0, losses: 0, avatar: '🏓' },
  { id: 'p30', name: 'Thach Le', email: '', phone: '', teamId: null, rating: 1200, wins: 0, losses: 0, avatar: '🏓' },
  { id: 'p31', name: 'Thomas Pham', email: '', phone: '', teamId: null, rating: 1200, wins: 0, losses: 0, avatar: '🏓' },
  { id: 'p32', name: 'Van Truong', email: '', phone: '', teamId: null, rating: 1200, wins: 0, losses: 0, avatar: '🏓' },
  { id: 'p33', name: 'Vicky Pham', email: '', phone: '', teamId: null, rating: 1200, wins: 0, losses: 0, avatar: '🏓' },
  { id: 'p34', name: 'Chau Nguyen', email: '', phone: '', teamId: null, rating: 1200, wins: 0, losses: 0, avatar: '🏓' },
];

export const seedMatchups: Matchup[] = [
  {
    id: 'm1', weekNumber: 1, homeTeamId: 't1', awayTeamId: 't2', status: 'scheduled',
    courtLocation: 'Court 1', scheduledTime: '2026-01-06T18:00',
    submittedBy: null, confirmedBy: null, disputeNote: null, games: []
  },
  {
    id: 'm2', weekNumber: 1, homeTeamId: 't3', awayTeamId: 't4', status: 'scheduled',
    courtLocation: 'Court 2', scheduledTime: '2026-01-06T18:00',
    submittedBy: null, confirmedBy: null, disputeNote: null, games: []
  },
  {
    id: 'm3', weekNumber: 1, homeTeamId: 't5', awayTeamId: 't6', status: 'scheduled',
    courtLocation: 'Court 3', scheduledTime: '2026-01-06T18:00',
    submittedBy: null, confirmedBy: null, disputeNote: null, games: []
  },
  {
    id: 'm4', weekNumber: 2, homeTeamId: 't1', awayTeamId: 't3', status: 'scheduled',
    courtLocation: 'Court 1', scheduledTime: '2026-01-13T18:00',
    submittedBy: null, confirmedBy: null, disputeNote: null, games: []
  },
  {
    id: 'm5', weekNumber: 2, homeTeamId: 't2', awayTeamId: 't5', status: 'scheduled',
    courtLocation: 'Court 2', scheduledTime: '2026-01-13T18:00',
    submittedBy: null, confirmedBy: null, disputeNote: null, games: []
  },
  {
    id: 'm6', weekNumber: 2, homeTeamId: 't4', awayTeamId: 't6', status: 'scheduled',
    courtLocation: 'Court 3', scheduledTime: '2026-01-13T18:00',
    submittedBy: null, confirmedBy: null, disputeNote: null, games: []
  },
  {
    id: 'm7', weekNumber: 3, homeTeamId: 't1', awayTeamId: 't5', status: 'scheduled',
    courtLocation: 'Court 1', scheduledTime: '2026-01-20T18:00',
    submittedBy: null, confirmedBy: null, disputeNote: null, games: []
  },
  {
    id: 'm8', weekNumber: 3, homeTeamId: 't3', awayTeamId: 't6', status: 'scheduled',
    courtLocation: 'Court 2', scheduledTime: '2026-01-20T18:00',
    submittedBy: null, confirmedBy: null, disputeNote: null, games: []
  },
  {
    id: 'm9', weekNumber: 3, homeTeamId: 't2', awayTeamId: 't4', status: 'scheduled',
    courtLocation: 'Court 3', scheduledTime: '2026-01-20T18:00',
    submittedBy: null, confirmedBy: null, disputeNote: null, games: []
  },
  {
    id: 'm10', weekNumber: 4, homeTeamId: 't2', awayTeamId: 't3', status: 'scheduled',
    courtLocation: 'Court 1', scheduledTime: '2026-01-27T18:00',
    submittedBy: null, confirmedBy: null, disputeNote: null, games: []
  },
  {
    id: 'm11', weekNumber: 4, homeTeamId: 't4', awayTeamId: 't1', status: 'scheduled',
    courtLocation: 'Court 2', scheduledTime: '2026-01-27T18:00',
    submittedBy: null, confirmedBy: null, disputeNote: null, games: []
  },
  {
    id: 'm12', weekNumber: 4, homeTeamId: 't6', awayTeamId: 't5', status: 'scheduled',
    courtLocation: 'Court 3', scheduledTime: '2026-01-27T18:00',
    submittedBy: null, confirmedBy: null, disputeNote: null, games: []
  },
  {
    id: 'm13', weekNumber: 5, homeTeamId: 't3', awayTeamId: 't1', status: 'scheduled',
    courtLocation: 'Court 1', scheduledTime: '2026-02-03T18:00',
    submittedBy: null, confirmedBy: null, disputeNote: null, games: []
  },
  {
    id: 'm14', weekNumber: 5, homeTeamId: 't5', awayTeamId: 't2', status: 'scheduled',
    courtLocation: 'Court 2', scheduledTime: '2026-02-03T18:00',
    submittedBy: null, confirmedBy: null, disputeNote: null, games: []
  },
  {
    id: 'm15', weekNumber: 5, homeTeamId: 't6', awayTeamId: 't4', status: 'scheduled',
    courtLocation: 'Court 3', scheduledTime: '2026-02-03T18:00',
    submittedBy: null, confirmedBy: null, disputeNote: null, games: []
  },
];
