import React, { createContext, useContext, useReducer, useEffect, ReactNode, useMemo } from 'react';
import { Player, Team, Matchup, ConfirmationToken, AuditEntry, League, LeagueState } from '../types';
import { seedTeams, seedPlayers, seedMatchups } from '../data/seedData';

// ============================================================
// DEMO LEAGUE DATA
// ============================================================
const demoLeague: League = {
  id: 'demo',
  name: 'Demo League',
  seasonName: 'Winter 2026',
  startDate: '2026-01-06',
  matchDayOfWeek: 1, // Monday
  matchTime: '18:00',
  totalWeeks: 5,
  isDemo: true,
  createdAt: new Date().toISOString(),
  teams: seedTeams,
  players: seedPlayers,
  matchups: seedMatchups,
  tokens: [],
  auditLog: [],
  currentWeek: 4,
};

// ============================================================
// ACTIONS
// ============================================================
type Action =
  | { type: 'CREATE_LEAGUE'; payload: League }
  | { type: 'DELETE_LEAGUE'; payload: string }
  | { type: 'SET_CURRENT_LEAGUE'; payload: string }
  | { type: 'SET_ADMIN'; payload: boolean }
  // League-scoped actions
  | { type: 'ADD_PLAYER'; payload: Player }
  | { type: 'UPDATE_PLAYER'; payload: Player }
  | { type: 'DELETE_PLAYER'; payload: string }
  | { type: 'ADD_TEAM'; payload: Team }
  | { type: 'UPDATE_TEAM'; payload: Team }
  | { type: 'DELETE_TEAM'; payload: string }
  | { type: 'SUBMIT_SCORES'; payload: { matchupId: string; games: Matchup['games']; submittedBy: string } }
  | { type: 'CONFIRM_SCORES'; payload: { matchupId: string; confirmedBy: string } }
  | { type: 'DISPUTE_SCORES'; payload: { matchupId: string; note: string } }
  | { type: 'UPDATE_MATCHUP'; payload: Matchup }
  | { type: 'ADD_TOKEN'; payload: ConfirmationToken }
  | { type: 'USE_TOKEN'; payload: string }
  | { type: 'ADD_AUDIT'; payload: AuditEntry }
  | { type: 'SET_WEEK'; payload: number }
  | { type: 'UPDATE_LEAGUE_SETTINGS'; payload: Partial<League> };

// ============================================================
// STATE
// ============================================================
const initialState: LeagueState = {
  leagues: [demoLeague],
  currentLeagueId: 'demo',
  isAdmin: false,
};

function loadState(): LeagueState {
  try {
    const saved = localStorage.getItem('zero2league_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure demo league always exists
      if (!parsed.leagues.find((l: League) => l.id === 'demo')) {
        parsed.leagues.unshift(demoLeague);
      }
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load state', e);
  }
  return initialState;
}

function updateCurrentLeague(state: LeagueState, updater: (league: League) => League): LeagueState {
  return {
    ...state,
    leagues: state.leagues.map(l => l.id === state.currentLeagueId ? updater(l) : l),
  };
}

function reducer(state: LeagueState, action: Action): LeagueState {
  switch (action.type) {
    case 'CREATE_LEAGUE':
      return { ...state, leagues: [...state.leagues, action.payload], currentLeagueId: action.payload.id };
    case 'DELETE_LEAGUE':
      if (action.payload === 'demo') return state; // Can't delete demo
      const remaining = state.leagues.filter(l => l.id !== action.payload);
      return {
        ...state,
        leagues: remaining,
        currentLeagueId: state.currentLeagueId === action.payload ? remaining[0]?.id || 'demo' : state.currentLeagueId,
      };
    case 'SET_CURRENT_LEAGUE':
      return { ...state, currentLeagueId: action.payload };
    case 'SET_ADMIN':
      return { ...state, isAdmin: action.payload };
    
    // League-scoped actions
    case 'ADD_PLAYER':
      return updateCurrentLeague(state, l => ({ ...l, players: [...l.players, action.payload] }));
    case 'UPDATE_PLAYER':
      return updateCurrentLeague(state, l => ({ ...l, players: l.players.map(p => p.id === action.payload.id ? action.payload : p) }));
    case 'DELETE_PLAYER':
      return updateCurrentLeague(state, l => ({ ...l, players: l.players.filter(p => p.id !== action.payload) }));
    case 'ADD_TEAM':
      return updateCurrentLeague(state, l => ({ ...l, teams: [...l.teams, action.payload] }));
    case 'UPDATE_TEAM':
      return updateCurrentLeague(state, l => ({ ...l, teams: l.teams.map(t => t.id === action.payload.id ? action.payload : t) }));
    case 'DELETE_TEAM':
      return updateCurrentLeague(state, l => ({ ...l, teams: l.teams.filter(t => t.id !== action.payload) }));
    case 'SUBMIT_SCORES':
      return updateCurrentLeague(state, l => ({
        ...l,
        matchups: l.matchups.map(m =>
          m.id === action.payload.matchupId
            ? { ...m, status: 'score_submitted' as const, games: action.payload.games, submittedBy: action.payload.submittedBy }
            : m
        )
      }));
    case 'CONFIRM_SCORES':
      return updateCurrentLeague(state, l => ({
        ...l,
        matchups: l.matchups.map(m =>
          m.id === action.payload.matchupId
            ? { ...m, status: 'confirmed' as const, confirmedBy: action.payload.confirmedBy }
            : m
        )
      }));
    case 'DISPUTE_SCORES':
      return updateCurrentLeague(state, l => ({
        ...l,
        matchups: l.matchups.map(m =>
          m.id === action.payload.matchupId
            ? { ...m, status: 'disputed' as const, disputeNote: action.payload.note }
            : m
        )
      }));
    case 'UPDATE_MATCHUP':
      return updateCurrentLeague(state, l => ({ ...l, matchups: l.matchups.map(m => m.id === action.payload.id ? action.payload : m) }));
    case 'ADD_TOKEN':
      return updateCurrentLeague(state, l => ({ ...l, tokens: [...l.tokens, action.payload] }));
    case 'USE_TOKEN':
      return updateCurrentLeague(state, l => ({ ...l, tokens: l.tokens.map(t => t.id === action.payload ? { ...t, used: true } : t) }));
    case 'ADD_AUDIT':
      return updateCurrentLeague(state, l => ({ ...l, auditLog: [action.payload, ...l.auditLog] }));
    case 'SET_WEEK':
      return updateCurrentLeague(state, l => ({ ...l, currentWeek: action.payload }));
    case 'UPDATE_LEAGUE_SETTINGS':
      return updateCurrentLeague(state, l => ({ ...l, ...action.payload }));
    default:
      return state;
  }
}

// ============================================================
// CONTEXT
// ============================================================
interface LeagueContextType {
  state: LeagueState;
  league: League; // Current league (convenience accessor)
  dispatch: React.Dispatch<Action>;
  getTeam: (id: string) => Team | undefined;
  getPlayer: (id: string) => Player | undefined;
  getTeamPlayers: (teamId: string) => Player[];
  getMatchupsForWeek: (week: number) => Matchup[];
}

const LeagueContext = createContext<LeagueContextType | undefined>(undefined);

export function LeagueProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  useEffect(() => {
    localStorage.setItem('zero2league_state', JSON.stringify(state));
  }, [state]);

  const league = useMemo(() => {
    return state.leagues.find(l => l.id === state.currentLeagueId) || state.leagues[0];
  }, [state.leagues, state.currentLeagueId]);

  const getTeam = (id: string) => league.teams.find(t => t.id === id);
  const getPlayer = (id: string) => league.players.find(p => p.id === id);
  const getTeamPlayers = (teamId: string) => league.players.filter(p => p.teamId === teamId);
  const getMatchupsForWeek = (week: number) => league.matchups.filter(m => m.weekNumber === week);

  return (
    <LeagueContext.Provider value={{ state, league, dispatch, getTeam, getPlayer, getTeamPlayers, getMatchupsForWeek }}>
      {children}
    </LeagueContext.Provider>
  );
}

export function useLeague() {
  const context = useContext(LeagueContext);
  if (!context) throw new Error('useLeague must be used within LeagueProvider');
  return context;
}
