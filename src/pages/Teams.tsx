import { useState } from 'react';
import { useLeague } from '../context/LeagueContext';
import { generateId, calculateTeamStandings } from '../utils/helpers';
import { Team } from '../types';

const TEAM_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899',
  '#14B8A6', '#F97316', '#84CC16', '#6366F1', '#0EA5E9', '#D946EF',
  '#059669', '#DC2626', '#7C3AED', '#DB2777',
];

export default function Teams() {
  const { state, dispatch, getTeamPlayers } = useLeague();
  const [showForm, setShowForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [formData, setFormData] = useState({ name: '', color: TEAM_COLORS[0], player1Id: '', player2Id: '' });
  const [showRandomize, setShowRandomize] = useState(false);
  const [randomIds, setRandomIds] = useState<string[]>([]);
  const standings = calculateTeamStandings(state.teams, state.matchups);

  const unassignedPlayers = state.players.filter(p => p.teamId === null);
  const currentMembers = editingTeam ? state.players.filter(p => p.teamId === editingTeam.id) : [];
  const selectablePlayers = editingTeam
    ? state.players.filter(p => p.teamId === null || p.teamId === editingTeam.id)
    : unassignedPlayers;
  const player1Options = selectablePlayers.filter(p => p.id !== formData.player2Id);
  const player2Options = selectablePlayers.filter(p => p.id !== formData.player1Id);
  const selectedP1 = state.players.find(p => p.id === formData.player1Id);
  const selectedP2 = state.players.find(p => p.id === formData.player2Id);
  const randomPool = unassignedPlayers.filter(p => randomIds.includes(p.id));
  const randomPairs = Math.floor(randomPool.length / 2);
  const randomLeftover = randomPool.length % 2;
  const canSave = editingTeam
    ? !!formData.name.trim()
    : !!(selectedP1 && selectedP2 && formData.name.trim());

  const nextColor = () => TEAM_COLORS[state.teams.length % TEAM_COLORS.length];

  const openCreate = () => {
    setEditingTeam(null);
    setFormData({ name: '', color: nextColor(), player1Id: '', player2Id: '' });
    setShowForm(true);
  };

  const openEdit = (team: Team) => {
    const members = state.players.filter(p => p.teamId === team.id);
    setEditingTeam(team);
    setFormData({ name: team.name, color: team.color, player1Id: members[0]?.id ?? '', player2Id: members[1]?.id ?? '' });
    setShowForm(true);
  };

  const setMember = (which: 1 | 2, id: string) => {
    const player1Id = which === 1 ? id : formData.player1Id;
    const player2Id = which === 2 ? id : formData.player2Id;
    const a = state.players.find(p => p.id === player1Id);
    const b = state.players.find(p => p.id === player2Id);
    const name = a && b ? `${a.name} & ${b.name}` : formData.name;
    setFormData({ ...formData, player1Id, player2Id, name });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingTeam) {
      if (!formData.name.trim()) return;
      dispatch({ type: 'UPDATE_TEAM', payload: { ...editingTeam, name: formData.name, color: formData.color } });
      if (selectedP1 && selectedP2) {
        const newIds = new Set([selectedP1.id, selectedP2.id]);
        currentMembers.forEach(m => {
          if (!newIds.has(m.id)) dispatch({ type: 'UPDATE_PLAYER', payload: { ...m, teamId: null } });
        });
        [selectedP1, selectedP2].forEach(m => {
          if (m.teamId !== editingTeam.id) dispatch({ type: 'UPDATE_PLAYER', payload: { ...m, teamId: editingTeam.id } });
        });
      }
      dispatch({ type: 'ADD_AUDIT', payload: { id: generateId(), action: 'update_team', timestamp: new Date().toISOString(), details: `Team "${formData.name}" updated`, userId: 'admin' } });
    } else {
      if (!selectedP1 || !selectedP2 || !formData.name.trim()) return;
      const newTeam: Team = { id: generateId(), name: formData.name, color: formData.color, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0 };
      dispatch({ type: 'ADD_TEAM', payload: newTeam });
      dispatch({ type: 'UPDATE_PLAYER', payload: { ...selectedP1, teamId: newTeam.id } });
      dispatch({ type: 'UPDATE_PLAYER', payload: { ...selectedP2, teamId: newTeam.id } });
      dispatch({ type: 'ADD_AUDIT', payload: { id: generateId(), action: 'create_team', timestamp: new Date().toISOString(), details: `Team "${formData.name}" created`, userId: 'admin' } });
    }
    resetForm();
  };

  const handleDelete = (team: Team) => {
    if (confirm(`Delete team "${team.name}"? Players on this team will become unassigned.`)) {
      dispatch({ type: 'DELETE_TEAM', payload: team.id });
      state.players.filter(p => p.teamId === team.id).forEach(p => {
        dispatch({ type: 'UPDATE_PLAYER', payload: { ...p, teamId: null } });
      });
      dispatch({ type: 'ADD_AUDIT', payload: { id: generateId(), action: 'delete_team', timestamp: new Date().toISOString(), details: `Team "${team.name}" deleted`, userId: 'admin' } });
    }
  };

  const openRandomize = () => {
    setRandomIds([]);
    setShowRandomize(true);
  };

  const toggleRandom = (id: string) => {
    setRandomIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleRandomizeConfirm = () => {
    if (randomPool.length < 2) return;
    const pool = [...randomPool];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    for (let i = 0; i < randomPairs; i++) {
      const a = pool[2 * i];
      const b = pool[2 * i + 1];
      const teamId = generateId();
      const name = `${a.name} & ${b.name}`;
      dispatch({ type: 'ADD_TEAM', payload: { id: teamId, name, color: TEAM_COLORS[(state.teams.length + i) % TEAM_COLORS.length], wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0 } });
      dispatch({ type: 'UPDATE_PLAYER', payload: { ...a, teamId } });
      dispatch({ type: 'UPDATE_PLAYER', payload: { ...b, teamId } });
    }
    dispatch({ type: 'ADD_AUDIT', payload: { id: generateId(), action: 'randomize_teams', timestamp: new Date().toISOString(), details: `Randomized ${randomPairs} doubles teams`, userId: 'admin' } });
    setShowRandomize(false);
    setRandomIds([]);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingTeam(null);
    setFormData({ name: '', color: TEAM_COLORS[0], player1Id: '', player2Id: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium text-gray-900">Teams</h1>
          <p className="text-gray-600 text-sm mt-1">{state.teams.length} teams in {state.seasonName}</p>
        </div>
        {state.isAdmin && (
          <div className="flex gap-2">
            <button
              onClick={openRandomize}
              className="px-4 py-2 rounded text-sm font-medium uppercase tracking-wide border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Randomize Teams
            </button>
            <button
              onClick={openCreate}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded text-sm font-medium uppercase tracking-wide transition-colors shadow-sm"
            >
              Add Team
            </button>
          </div>
        )}
      </div>

      {/* Team Form Dialog */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <h2 className="px-6 pt-6 pb-2 text-lg font-medium text-gray-900">
              {editingTeam ? 'Edit Team' : 'Add Doubles Team'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="px-6 pb-2 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="player-1">Player 1</label>
                  <select
                    id="player-1"
                    value={formData.player1Id}
                    onChange={e => setMember(1, e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded outline-none transition-shadow focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    required
                  >
                    <option value="">Select a player</option>
                    {player1Options.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="player-2">Player 2</label>
                  <select
                    id="player-2"
                    value={formData.player2Id}
                    onChange={e => setMember(2, e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded outline-none transition-shadow focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    required
                  >
                    <option value="">Select a player</option>
                    {player2Options.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="team-name">Team name</label>
                  <input
                    id="team-name"
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded outline-none transition-shadow focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Team color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={e => setFormData({ ...formData, color: e.target.value })}
                      aria-label="Team color"
                      className="h-10 w-14 rounded border border-gray-300 bg-white p-1 cursor-pointer"
                    />
                    <span className="text-sm text-gray-600 uppercase">{formData.color}</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 px-6 py-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3 py-2 rounded text-sm font-medium uppercase tracking-wide text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!canSave}
                  className="px-4 py-2 rounded text-sm font-medium uppercase tracking-wide bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Randomize Dialog */}
      {showRandomize && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full flex flex-col max-h-[80vh]">
            <h2 className="px-6 pt-6 pb-2 text-lg font-medium text-gray-900">Randomize Doubles Teams</h2>
            <p className="px-6 pb-2 text-sm text-gray-600">
              Pick the players to shuffle. {randomPool.length} selected — will create {randomPairs} doubles team{randomPairs === 1 ? '' : 's'}{randomLeftover ? `, ${randomLeftover} left unassigned` : ''}.
            </p>
            <div className="flex gap-2 px-6 pb-2">
              <button
                type="button"
                onClick={() => setRandomIds(unassignedPlayers.map(p => p.id))}
                className="px-2 py-1 rounded text-xs font-medium uppercase tracking-wide text-emerald-700 hover:bg-emerald-50 transition-colors"
              >
                Select all
              </button>
              <button
                type="button"
                onClick={() => setRandomIds([])}
                className="px-2 py-1 rounded text-xs font-medium uppercase tracking-wide text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Clear
              </button>
            </div>
            <div className="px-6 pb-2 overflow-y-auto">
              {unassignedPlayers.length === 0 ? (
                <p className="text-sm text-gray-600 py-4">No unassigned players left to randomize.</p>
              ) : (
                unassignedPlayers.map(p => (
                  <label key={p.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={randomIds.includes(p.id)}
                      onChange={() => toggleRandom(p.id)}
                      className="h-4 w-4 accent-emerald-600"
                    />
                    <span className="text-sm text-gray-800">{p.name}</span>
                  </label>
                ))
              )}
            </div>
            <div className="flex justify-end gap-2 px-6 py-4">
              <button
                type="button"
                onClick={() => setShowRandomize(false)}
                className="px-3 py-2 rounded text-sm font-medium uppercase tracking-wide text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRandomizeConfirm}
                disabled={randomPool.length < 2}
                className="px-4 py-2 rounded text-sm font-medium uppercase tracking-wide bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                Randomize
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Teams Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {standings.map((team, idx) => {
          const players = getTeamPlayers(team.id);
          const winRate = team.wins + team.losses > 0 ? Math.round((team.wins / (team.wins + team.losses)) * 100) : 0;

          return (
            <div key={team.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-1" style={{ backgroundColor: team.color }}></div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-medium tabular-nums">
                        {idx + 1}
                      </span>
                      <h3 className="font-medium text-gray-900">{team.name}</h3>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{players.length} players</p>
                  </div>
                  {state.isAdmin && (
                    <div className="flex gap-1 whitespace-nowrap">
                      <button
                        onClick={() => openEdit(team)}
                        className="px-2 py-1 rounded text-xs font-medium uppercase tracking-wide text-emerald-700 hover:bg-emerald-50 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(team)}
                        className="px-2 py-1 rounded text-xs font-medium uppercase tracking-wide text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="bg-gray-50 rounded p-2">
                    <div className="text-lg font-medium text-gray-900 tabular-nums">{team.wins}</div>
                    <div className="text-xs text-gray-600">Wins</div>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <div className="text-lg font-medium text-gray-900 tabular-nums">{team.losses}</div>
                    <div className="text-xs text-gray-600">Losses</div>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <div className="text-lg font-medium text-gray-900 tabular-nums">{team.pointDiff > 0 ? '+' : ''}{team.pointDiff}</div>
                    <div className="text-xs text-gray-600">Diff</div>
                  </div>
                </div>

                {/* Win Rate Bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Win rate</span>
                    <span className="tabular-nums">{winRate}%</span>
                  </div>
                  <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${winRate}%`, backgroundColor: team.color }}></div>
                  </div>
                </div>

                {/* Roster Preview */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {players.slice(0, 4).map(p => (
                    <span key={p.id} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                      {p.name.split(' ')[0]}
                    </span>
                  ))}
                  {players.length > 4 && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      +{players.length - 4} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
