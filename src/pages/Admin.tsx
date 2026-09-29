import { useState } from 'react';
import { useLeague } from '../context/LeagueContext';
import { generateId, getStatusColor, getStatusLabel, formatDate } from '../utils/helpers';
import { Link } from 'react-router-dom';

export default function Admin() {
  const { state, dispatch, getTeam, getPlayer } = useLeague();
  const [activeTab, setActiveTab] = useState<'overview' | 'audit' | 'tokens' | 'settings'>('overview');

  const pendingMatches = state.matchups.filter(m => m.status === 'score_submitted');
  const disputedMatches = state.matchups.filter(m => m.status === 'disputed');

  const handleForceConfirm = (matchupId: string) => {
    dispatch({ type: 'CONFIRM_SCORES', payload: { matchupId, confirmedBy: 'admin' } });
    dispatch({
      type: 'ADD_AUDIT',
      payload: { id: generateId(), action: 'admin_confirm', timestamp: new Date().toISOString(), details: `Admin force-confirmed scores for matchup ${matchupId}`, userId: 'admin' }
    });
  };

  const handleResetMatchup = (matchupId: string) => {
    if (confirm('Reset this matchup to scheduled? All scores will be cleared.')) {
      const matchup = state.matchups.find(m => m.id === matchupId);
      if (matchup) {
        dispatch({ type: 'UPDATE_MATCHUP', payload: { ...matchup, status: 'scheduled', games: [], submittedBy: null, confirmedBy: null, disputeNote: null } });
        dispatch({
          type: 'ADD_AUDIT',
          payload: { id: generateId(), action: 'admin_reset', timestamp: new Date().toISOString(), details: `Admin reset matchup ${matchupId} to scheduled`, userId: 'admin' }
        });
      }
    }
  };

  const handleSetWeek = (week: number) => {
    dispatch({ type: 'SET_WEEK', payload: week });
    dispatch({
      type: 'ADD_AUDIT',
      payload: { id: generateId(), action: 'set_week', timestamp: new Date().toISOString(), details: `Current week set to ${week}`, userId: 'admin' }
    });
  };

  const handleResetAll = () => {
    if (confirm('⚠️ This will reset ALL data to the initial seed state. Are you sure?')) {
      localStorage.removeItem('picklepal_state');
      window.location.reload();
    }
  };

  if (!state.isAdmin) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Access Required</h2>
        <p className="text-gray-500 mb-4">Toggle the Admin button in the header to access admin features.</p>
        <p className="text-sm text-gray-400">Note: In this demo, admin mode is toggled without authentication.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-gray-500 text-sm mt-1">Manage league settings, resolve disputes, and monitor activity</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg overflow-x-auto">
        {(['overview', 'audit', 'tokens', 'settings'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'overview' && '📊 '}
            {tab === 'audit' && '📋 '}
            {tab === 'tokens' && '🔗 '}
            {tab === 'settings' && '⚙️ '}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="text-2xl font-bold text-gray-900">{state.teams.length}</div>
              <div className="text-xs text-gray-500">Teams</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="text-2xl font-bold text-gray-900">{state.players.length}</div>
              <div className="text-xs text-gray-500">Players</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="text-2xl font-bold text-gray-900">{state.matchups.filter(m => m.status === 'confirmed').length}</div>
              <div className="text-xs text-gray-500">Completed</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="text-2xl font-bold text-gray-900">{state.auditLog.length}</div>
              <div className="text-xs text-gray-500">Audit Entries</div>
            </div>
          </div>

          {/* Pending Confirmations */}
          {pendingMatches.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
              <h3 className="font-semibold text-yellow-800 mb-3">⏳ Pending Confirmations ({pendingMatches.length})</h3>
              <div className="space-y-2">
                {pendingMatches.map(m => {
                  const home = getTeam(m.homeTeamId);
                  const away = getTeam(m.awayTeamId);
                  return (
                    <div key={m.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-yellow-100">
                      <div className="text-sm">
                        <span className="font-medium">{home?.name}</span> vs <span className="font-medium">{away?.name}</span>
                        <span className="text-gray-400 ml-2">(Week {m.weekNumber})</span>
                      </div>
                      <div className="flex gap-2">
                        <Link to={`/matchups/${m.id}/confirm`} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200">
                          Review
                        </Link>
                        <button onClick={() => handleForceConfirm(m.id)} className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full hover:bg-emerald-200">
                          Force Confirm
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Disputed Matches */}
          {disputedMatches.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5">
              <h3 className="font-semibold text-red-800 mb-3">⚠️ Disputed Scores ({disputedMatches.length})</h3>
              <div className="space-y-2">
                {disputedMatches.map(m => {
                  const home = getTeam(m.homeTeamId);
                  const away = getTeam(m.awayTeamId);
                  return (
                    <div key={m.id} className="bg-white p-3 rounded-lg border border-red-100">
                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          <span className="font-medium">{home?.name}</span> vs <span className="font-medium">{away?.name}</span>
                          <span className="text-gray-400 ml-2">(Week {m.weekNumber})</span>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleForceConfirm(m.id)} className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full hover:bg-emerald-200">
                            Confirm as Admin
                          </button>
                          <button onClick={() => handleResetMatchup(m.id)} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200">
                            Reset
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-red-600 mt-1">Note: {m.disputeNote}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* All Matchups Status */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">All Matchups</h3>
            <div className="space-y-2">
              {state.matchups.map(m => {
                const home = getTeam(m.homeTeamId);
                const away = getTeam(m.awayTeamId);
                return (
                  <div key={m.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="text-sm">
                      <span className="text-gray-400 text-xs mr-2">W{m.weekNumber}</span>
                      <span className="font-medium">{home?.name}</span>
                      <span className="text-gray-400 mx-1">vs</span>
                      <span className="font-medium">{away?.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(m.status)}`}>
                        {getStatusLabel(m.status)}
                      </span>
                      <button onClick={() => handleResetMatchup(m.id)} className="text-xs text-gray-400 hover:text-red-500" title="Reset">
                        ↺
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Audit Log</h3>
            <p className="text-xs text-gray-500">All actions recorded in the system</p>
          </div>
          {state.auditLog.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">No audit entries yet</div>
          ) : (
            <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
              {state.auditLog.map(entry => (
                <div key={entry.id} className="px-4 py-3 flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{entry.details}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(entry.timestamp).toLocaleString()} • by {entry.userId}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'tokens' && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Confirmation Tokens</h3>
            <p className="text-xs text-gray-500">Tokens generated for score confirmations</p>
          </div>
          {state.tokens.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">No tokens generated yet. Submit scores to generate tokens.</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {state.tokens.map(token => {
                const matchup = state.matchups.find(m => m.id === token.matchupId);
                const home = getTeam(matchup?.homeTeamId || '');
                const away = getTeam(matchup?.awayTeamId || '');
                return (
                  <div key={token.id} className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{home?.name} vs {away?.name}</p>
                        <p className="text-xs text-gray-500 font-mono mt-1">Token: {token.token.substring(0, 20)}...</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${token.used ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'}`}>
                          {token.used ? 'Used' : 'Active'}
                        </span>
                        <p className="text-xs text-gray-400 mt-1">Expires: {new Date(token.expiresAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Season Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Week</label>
                <div className="flex items-center gap-3">
                  <select
                    value={state.currentWeek}
                    onChange={e => handleSetWeek(parseInt(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(w => <option key={w} value={w}>Week {w}</option>)}
                  </select>
                  <span className="text-sm text-gray-500">Set the current active week</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Season Name</label>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-900 font-medium">{state.seasonName}</span>
                  <span className="text-xs text-gray-400">(Read-only in demo)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Links</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <Link to="/teams" className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <span>👥</span>
                <span className="text-sm font-medium text-gray-700">Manage Teams</span>
              </Link>
              <Link to="/players" className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <span>🏓</span>
                <span className="text-sm font-medium text-gray-700">Manage Players</span>
              </Link>
              <Link to="/matchups" className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <span>⚔️</span>
                <span className="text-sm font-medium text-gray-700">Manage Matchups</span>
              </Link>
              <Link to="/rankings" className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <span>🏆</span>
                <span className="text-sm font-medium text-gray-700">View Rankings</span>
              </Link>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-xl p-5">
            <h3 className="font-semibold text-red-800 mb-2">Danger Zone</h3>
            <p className="text-sm text-red-600 mb-3">Reset all data to initial state. This cannot be undone.</p>
            <button
              onClick={handleResetAll}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Reset All Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
