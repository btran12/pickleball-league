import { useState } from 'react';
import { useLeague } from '../context/LeagueContext';
import { generateId } from '../utils/helpers';
import { Player } from '../types';

export default function Players() {
  const { state, dispatch, getTeam } = useLeague();
  const [showForm, setShowForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTeam, setFilterTeam] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'wins'>('rating');
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', teamId: '', rating: 1200, avatar: '🏓' });

  const filteredPlayers = state.players
    .filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTeam = filterTeam === 'all' || p.teamId === filterTeam;
      return matchesSearch && matchesTeam;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'rating') return b.rating - a.rating;
      return b.wins - a.wins;
    });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingPlayer) {
      dispatch({ type: 'UPDATE_PLAYER', payload: { ...editingPlayer, ...formData, teamId: formData.teamId || null } });
      dispatch({ type: 'ADD_AUDIT', payload: { id: generateId(), action: 'update_player', timestamp: new Date().toISOString(), details: `Player "${formData.name}" updated`, userId: 'admin' } });
    } else {
      const newPlayer: Player = { id: generateId(), ...formData, teamId: formData.teamId || null, wins: 0, losses: 0 };
      dispatch({ type: 'ADD_PLAYER', payload: newPlayer });
      dispatch({ type: 'ADD_AUDIT', payload: { id: generateId(), action: 'create_player', timestamp: new Date().toISOString(), details: `Player "${formData.name}" added`, userId: 'admin' } });
    }
    resetForm();
  };

  const handleEdit = (player: Player) => {
    setEditingPlayer(player);
    setFormData({ name: player.name, email: player.email, phone: player.phone, teamId: player.teamId || '', rating: player.rating, avatar: player.avatar });
    setShowForm(true);
  };

  const handleDelete = (player: Player) => {
    if (confirm(`Remove player "${player.name}"?`)) {
      dispatch({ type: 'DELETE_PLAYER', payload: player.id });
      dispatch({ type: 'ADD_AUDIT', payload: { id: generateId(), action: 'delete_player', timestamp: new Date().toISOString(), details: `Player "${player.name}" removed`, userId: 'admin' } });
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingPlayer(null);
    setFormData({ name: '', email: '', phone: '', teamId: '', rating: 1200, avatar: '🏓' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium text-gray-900">Players</h1>
          <p className="text-gray-600 text-sm mt-1">{state.players.length} registered players</p>
        </div>
        {state.isAdmin && (
          <button
            onClick={() => setShowForm(true)}
            className="self-start sm:self-auto bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded text-sm font-medium uppercase tracking-wide transition-colors shadow-sm"
          >
            Add Player
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search players"
          aria-label="Search players"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="flex-1 px-3 py-2 text-sm bg-white border border-gray-300 rounded outline-none transition-shadow focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
        />
        <select
          value={filterTeam}
          onChange={e => setFilterTeam(e.target.value)}
          aria-label="Filter by team"
          className="sm:w-48 px-3 py-2 text-sm bg-white border border-gray-300 rounded outline-none transition-shadow focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
        >
          <option value="all">All teams</option>
          {state.teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as any)}
          aria-label="Sort players"
          className="sm:w-48 px-3 py-2 text-sm bg-white border border-gray-300 rounded outline-none transition-shadow focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
        >
          <option value="rating">Sort: rating</option>
          <option value="name">Sort: name</option>
          <option value="wins">Sort: wins</option>
        </select>
      </div>

      {/* Player Form Dialog */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="px-6 pt-6 pb-2 text-lg font-medium text-gray-900">
              {editingPlayer ? 'Edit Player' : 'Add Player'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="px-6 pb-2 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded outline-none transition-shadow focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded outline-none transition-shadow focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded outline-none transition-shadow focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Team</label>
                  <select
                    value={formData.teamId}
                    onChange={e => setFormData({ ...formData, teamId: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded outline-none transition-shadow focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  >
                    <option value="">No team</option>
                    {state.teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Rating</label>
                  <input
                    type="number"
                    value={formData.rating}
                    onChange={e => setFormData({ ...formData, rating: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded outline-none transition-shadow focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    min="0"
                    max="3000"
                  />
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

      {/* Players List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wide">Player</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wide hidden sm:table-cell">Team</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wide">Rating</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wide">W/L</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wide hidden md:table-cell">Win %</th>
                {state.isAdmin && <th className="text-right px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wide">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPlayers.map(player => {
                const team = getTeam(player.teamId || '');
                const winRate = player.wins + player.losses > 0 ? Math.round((player.wins / (player.wins + player.losses)) * 100) : 0;
                return (
                  <tr key={player.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{player.name}</div>
                      <div className="text-xs text-gray-500">{player.email}</div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {team ? (
                        <span
                          className="inline-block text-xs font-medium px-2 py-0.5 rounded"
                          style={{ backgroundColor: team.color + '1a', color: team.color }}
                        >
                          {team.name}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-900">{player.rating}</td>
                    <td className="px-4 py-3 text-right text-sm text-gray-700">
                      {player.wins}&ndash;{player.losses}
                    </td>
                    <td className="px-4 py-3 text-right hidden md:table-cell">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${winRate}%` }}></div>
                        </div>
                        <span className="text-xs text-gray-600 tabular-nums w-8">{winRate}%</span>
                      </div>
                    </td>
                    {state.isAdmin && (
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleEdit(player)}
                          className="px-2 py-1 rounded text-xs font-medium uppercase tracking-wide text-emerald-700 hover:bg-emerald-50 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(player)}
                          className="px-2 py-1 rounded text-xs font-medium uppercase tracking-wide text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                          Remove
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredPlayers.length === 0 && (
          <div className="text-center py-10 text-sm text-gray-600">
            No players found matching your criteria
          </div>
        )}
      </div>
    </div>
  );
}
