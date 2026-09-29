export interface Player {
  id: string;
  name: string;
  email: string;
  phone: string;
  teamId: string | null;
  rating: number;
  wins: number;
  losses: number;
  avatar: string;
}

export interface Team {
  id: string;
  name: string;
  color: string;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
}

export interface Game {
  id: string;
  matchupId: string;
  homePlayer1Id: string;
  homePlayer2Id: string;
  awayPlayer1Id: string;
  awayPlayer2Id: string;
  homeScore: number | null;
  awayScore: number | null;
}

export interface Matchup {
  id: string;
  weekNumber: number;
  homeTeamId: string;
  awayTeamId: string;
  status: 'scheduled' | 'score_submitted' | 'confirmed' | 'disputed';
  courtLocation: string;
  scheduledTime: string;
  submittedBy: string | null;
  confirmedBy: string | null;
  disputeNote: string | null;
  games: Game[];
}

export interface ConfirmationToken {
  id: string;
  matchupId: string;
  token: string;
  expiresAt: string;
  used: boolean;
}

export interface AuditEntry {
  id: string;
  action: string;
  timestamp: string;
  details: string;
  userId: string;
}

export interface League {
  id: string;
  name: string;
  seasonName: string;
  startDate: string; // ISO date string
  matchDayOfWeek: number; // 0=Sunday, 1=Monday, ... 6=Saturday
  matchTime: string; // HH:mm format
  totalWeeks: number;
  isDemo: boolean;
  createdAt: string;
  teams: Team[];
  players: Player[];
  matchups: Matchup[];
  tokens: ConfirmationToken[];
  auditLog: AuditEntry[];
  currentWeek: number;
}

export interface LeagueState {
  leagues: League[];
  currentLeagueId: string;
  isAdmin: boolean;
}
