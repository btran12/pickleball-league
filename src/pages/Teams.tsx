import { useState } from 'react';
import { useLeague } from '../context/LeagueContext';
import { generateId, calculateTeamStandings } from '../utils/helpers';
import { Team } from '../types';

export default function Teams() {
  const { state, league, dispatch, getTeamPlayers } = useLeague();
  const [showForm, setShowForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [formData, setFormData] = useState({ name: '', color: '#3B82F6' });
  const standings = calculateTeamStandings(league.teams, league.matchups);

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
      league.players.filter((p: any) => p.teamId === team.id).forEach((p: any) => {
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
          <p className="text-gray-500 text-sm mt-1">{league.teams.length} teams in {league.seasonName}</p>
        </div>
        {state.isAdmin && (
          <button onClick={() => setShowForm(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm">
            + Add Team
          </button>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">{editingTeam ? 'Edit Team' : 'Add New Team'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" placeholder="e.g., Smash Masters" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team Color</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} className="w-10 h-10 rounded-lg cursor-pointer border-0" />
                  <span className="text-sm text-gray-500">{formData.color}</span>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-medium transition-colors">{editingTeam ? 'Update' : 'Create'}</button>
                <button type="button" onClick={resetForm} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg font-medium transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {standings.map((team: any, idx: number) => {
          const players = getTeamPlayers(team.id);
          const winRate = team.wins + team.losses > 0 ? Math.round((team.wins / (team.wins + team.losses)) * 100) : 0;
          return (
            <div key={team.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-2" style={{ backgroundColor: team.color }}></div>
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : idx === 1 ? 'bg-gray-100 text-gray-600' : idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-50 text-gray-500'}`}>#{idx + 1}</span>
                      <h3 className="font-semibold text-gray-900">{team.name}</h3>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{players.length} players</p>
                  </div>
                  {state.isAdmin && (
                    <div className="flex gap-1">
                      <button onClick={() => handleEdit(team)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => handleDelete(team)} className="p-1.5 text-gray-400 hover:text-red-600 rounded transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  )}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="bg-green-50 rounded-lg p-2"><div className="text-lg font-bold text-green-700">{team.wins}</div><div className="text-xs text-green-600">Wins</div></div>
                  <div className="bg-red-50 rounded-lg p-2"><div className="text-lg font-bold text-red-700">{team.losses}</div><div className="text-xs text-red-600">Losses</div></div>
                  <div className="bg-blue-50 rounded-lg p-2"><div className="text-lg font-bold text-blue-700">{team.pointDiff > 0 ? '+' : ''}{team.pointDiff}</div><div className="text-xs text-blue-600">Diff</div></div>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1"><span>Win Rate</span><span>{winRate}%</span></div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: `${winRate}%`, backgroundColor: team.color }}></div></div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {players.slice(0, 4).map((p: any) => (
                    <span key={p.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{p.avatar} {p.name.split(' ')[0]}</span>
                  ))}
                  {players.length > 4 && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">+{players.length - 4} more</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
