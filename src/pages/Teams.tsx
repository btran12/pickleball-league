import { useState } from 'react';
import { useLeague } from '../context/LeagueContext';
import { generateId, calculateTeamStandings } from '../utils/helpers';
import { Team } from '../types';

export default function Teams() {
  const { state, dispatch, getTeamPlayers } = useLeague();
  const [showForm, setShowForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [formData, setFormData] = useState({ name: '', color: '#3B82F6' });
  const standings = calculateTeamStandings(state.teams, state.matchups);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingTeam) {
      dispatch({ type: 'UPDATE_TEAM', payload: { ...editingTeam, name: formData.name, color: formData.color } });
      dispatch({ type: 'ADD_AUDIT', payload: { id: generateId(), action: 'update_team', timestamp: new Date().toISOString(), details: `Team "${formData.name}" updated`, userId: 'admin' } });
    } else {
      const newTeam: Team = { id: generateId(), name: formData.name, color: formData.color, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0 };
      dispatch({ type: 'ADD_TEAM', payload: newTeam });
      dispatch({ type: 'ADD_AUDIT', payload: { id: generateId(), action: 'create_team', timestamp: new Date().toISOString(), details: `Team "${formData.name}" created`, userId: 'admin' } });
    }
    resetForm();
  };

  const handleEdit = (team: Team) => {
    setEditingTeam(team);
    setFormData({ name: team.name, color: team.color });
    setShowForm(true);
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

  const resetForm = () => {
    setShowForm(false);
    setEditingTeam(null);
    setFormData({ name: '', color: '#3B82F6' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium text-gray-900">Teams</h1>
          <p className="text-gray-600 text-sm mt-1">{state.teams.length} teams in {state.seasonName}</p>
        </div>
        {state.isAdmin && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded text-sm font-medium uppercase tracking-wide transition-colors shadow-sm"
          >
            Add Team
          </button>
        )}
      </div>

      {/* Team Form Dialog */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <h2 className="px-6 pt-6 pb-2 text-lg font-medium text-gray-900">
              {editingTeam ? 'Edit Team' : 'Add Team'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="px-6 pb-2 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Team name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded outline-none transition-shadow focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    placeholder="e.g., Smash Masters"
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
                  className="px-4 py-2 rounded text-sm font-medium uppercase tracking-wide bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  Save
                </button>
              </div>
            </form>
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
                        onClick={() => handleEdit(team)}
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
