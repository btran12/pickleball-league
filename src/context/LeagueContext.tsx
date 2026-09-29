import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Player, Team, Matchup, ConfirmationToken, AuditEntry, LeagueState } from '../types';
import { seedTeams, seedPlayers, seedMatchups } from '../data/seedData';

type Action =
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
  | { type: 'SET_ADMIN'; payload: boolean }
  | { type: 'SET_WEEK'; payload: number };

const initialState: LeagueState = {
  players: seedPlayers,
  teams: seedTeams,
  matchups: seedMatchups,
  tokens: [],
  auditLog: [],
  currentWeek: 4,
  seasonName: 'Winter 2026',
  isAdmin: false,
};

function loadState(): LeagueState {
  try {
    const saved = localStorage.getItem('picklepal_state');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load state', e);
  }
  return initialState;
}

function reducer(state: LeagueState, action: Action): LeagueState {
  switch (action.type) {
    case 'ADD_PLAYER':
      return { ...state, players: [...state.players, action.payload] };
    case 'UPDATE_PLAYER':
      return { ...state, players: state.players.map(p => p.id === action.payload.id ? action.payload : p) };
    case 'DELETE_PLAYER':
      return { ...state, players: state.players.filter(p => p.id !== action.payload) };
    case 'ADD_TEAM':
      return { ...state, teams: [...state.teams, action.payload] };
    case 'UPDATE_TEAM':
      return { ...state, teams: state.teams.map(t => t.id === action.payload.id ? action.payload : t) };
    case 'DELETE_TEAM':
      return { ...state, teams: state.teams.filter(t => t.id !== action.payload) };
    case 'SUBMIT_SCORES':
      return {
        ...state,
        matchups: state.matchups.map(m =>
          m.id === action.payload.matchupId
            ? { ...m, status: 'score_submitted' as const, games: action.payload.games, submittedBy: action.payload.submittedBy }
            : m
        )
      };
    case 'CONFIRM_SCORES':
      return {
        ...state,
        matchups: state.matchups.map(m =>
          m.id === action.payload.matchupId
            ? { ...m, status: 'confirmed' as const, confirmedBy: action.payload.confirmedBy }
            : m
        )
      };
    case 'DISPUTE_SCORES':
      return {
        ...state,
        matchups: state.matchups.map(m =>
          m.id === action.payload.matchupId
            ? { ...m, status: 'disputed' as const, disputeNote: action.payload.note }
            : m
        )
      };
    case 'UPDATE_MATCHUP':
      return { ...state, matchups: state.matchups.map(m => m.id === action.payload.id ? action.payload : m) };
    case 'ADD_TOKEN':
      return { ...state, tokens: [...state.tokens, action.payload] };
    case 'USE_TOKEN':
      return { ...state, tokens: state.tokens.map(t => t.id === action.payload ? { ...t, used: true } : t) };
    case 'ADD_AUDIT':
      return { ...state, auditLog: [action.payload, ...state.auditLog] };
    case 'SET_ADMIN':
      return { ...state, isAdmin: action.payload };
    case 'SET_WEEK':
      return { ...state, currentWeek: action.payload };
    default:
      return state;
  }
}

interface LeagueContextType {
  state: LeagueState;
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
    localStorage.setItem('picklepal_state', JSON.stringify(state));
  }, [state]);

  const getTeam = (id: string) => state.teams.find(t => t.id === id);
  const getPlayer = (id: string) => state.players.find(p => p.id === id);
  const getTeamPlayers = (teamId: string) => state.players.filter(p => p.teamId === teamId);
  const getMatchupsForWeek = (week: number) => state.matchups.filter(m => m.weekNumber === week);

  return (
    <LeagueContext.Provider value={{ state, dispatch, getTeam, getPlayer, getTeamPlayers, getMatchupsForWeek }}>
      {children}
    </LeagueContext.Provider>
  );
}

export function useLeague() {
  const context = useContext(LeagueContext);
  if (!context) throw new Error('useLeague must be used within LeagueProvider');
  return context;
}
