import { useState } from 'react';
import { useLeague } from '../context/LeagueContext';
import { generateId } from '../utils/helpers';
import { Player } from '../types';

export default function Players() {
  const { state, league, dispatch, getTeam } = useLeague();
  const [showForm, setShowForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTeam, setFilterTeam] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'wins'>('rating');
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', teamId: '', rating: 1200, avatar: '🏓' });

  const avatars = ['🏓', '🎾', '⚡', '🌟', '🔥', '💫', '🎯', '🏆', '👑', '💎', '🚀', '🎪', '🌊', '🎸', '🌈', '🎭', '🍀', '🦋', '🔮', '🌺', '🌙', '⭐', '🎵', '🦅'];

  const filteredPlayers = league.players
    .filter((p: any) => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTeam = filterTeam === 'all' || p.teamId === filterTeam;
      return matchesSearch && matchesTeam;
    })
    .sort((a: any, b: any) => {
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
          <h1 className="text-2xl font-bold text-gray-900">Players</h1>
          <p className="text-gray-500 text-sm mt-1">{league.players.length} registered players</p>
        </div>
        {state.isAdmin && (
          <button onClick={() => setShowForm(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm">+ Add Player</button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" placeholder="Search players..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
        </div>
        <select value={filterTeam} onChange={e => setFilterTeam(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none">
          <option value="all">All Teams</option>
          {league.teams.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none">
          <option value="rating">Sort by Rating</option>
          <option value="name">Sort by Name</option>
          <option value="wins">Sort by Wins</option>
        </select>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">{editingPlayer ? 'Edit Player' : 'Add New Player'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Avatar</label>
                <div className="flex flex-wrap gap-2">
                  {avatars.map(a => (
                    <button key={a} type="button" onClick={() => setFormData({ ...formData, avatar: a })}
                      className={`w-9 h-9 flex items-center justify-center rounded-lg text-lg transition-all ${formData.avatar === a ? 'bg-emerald-100 ring-2 ring-emerald-500' : 'bg-gray-100 hover:bg-gray-200'}`}>{a}</button>
                  ))}
                </div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Name</label><input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" required /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" required /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" /></div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team</label>
                <select value={formData.teamId} onChange={e => setFormData({ ...formData, teamId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none">
                  <option value="">No Team</option>
                  {league.teams.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Rating</label><input type="number" value={formData.rating} onChange={e => setFormData({ ...formData, rating: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" min="0" max="3000" /></div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-medium transition-colors">{editingPlayer ? 'Update' : 'Add Player'}</button>
                <button type="button" onClick={resetForm} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg font-medium transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Player</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Team</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Rating</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">W/L</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Win %</th>
                {state.isAdmin && <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredPlayers.map((player: any) => {
                const team = getTeam(player.teamId || '');
                const winRate = player.wins + player.losses > 0 ? Math.round((player.wins / (player.wins + player.losses)) * 100) : 0;
                return (
                  <tr key={player.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3"><div className="flex items-center gap-3"><span className="text-2xl">{player.avatar}</span><div><div className="font-medium text-gray-900 text-sm">{player.name}</div><div className="text-xs text-gray-500">{player.email}</div></div></div></td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {team ? (<span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full" style={{ backgroundColor: team.color + '20', color: team.color }}><span className="w-2 h-2 rounded-full" style={{ backgroundColor: team.color }}></span>{team.name}</span>) : (<span className="text-xs text-gray-400">Unassigned</span>)}
                    </td>
                    <td className="px-4 py-3 text-center"><span className="text-sm font-semibold text-gray-900">{player.rating}</span></td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600"><span className="text-green-600 font-medium">{player.wins}</span><span className="text-gray-300 mx-1">-</span><span className="text-red-600 font-medium">{player.losses}</span></td>
                    <td className="px-4 py-3 text-center hidden md:table-cell"><div className="flex items-center justify-center gap-2"><div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${winRate}%` }}></div></div><span className="text-xs text-gray-500">{winRate}%</span></div></td>
                    {state.isAdmin && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => handleEdit(player)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                          <button onClick={() => handleDelete(player)} className="p-1.5 text-gray-400 hover:text-red-600 rounded transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredPlayers.length === 0 && (<div className="text-center py-8 text-gray-500">No players found matching your criteria</div>)}
      </div>
    </div>
  );
}
