import { useState } from 'react';
import { useLeague } from '../context/LeagueContext';
import { generateId, getStatusColor, getStatusLabel } from '../utils/helpers';
import { Link } from 'react-router-dom';

const tabLabels = {
  overview: 'Overview',
  audit: 'Audit Log',
  tokens: 'Tokens',
  settings: 'Settings',
} as const;

export default function Admin() {
  const { state, dispatch, getTeam } = useLeague();
  const [activeTab, setActiveTab] = useState<'overview' | 'audit' | 'tokens' | 'settings'>('overview');

  const pendingMatches = state.matchups.filter(m => m.status === 'score_submitted');
  const disputedMatches = state.matchups.filter(m => m.status === 'disputed');

  const handleForceConfirm = (matchupId: string) => {
    dispatch({ type: 'CONFIRM_SCORES', payload: { matchupId, confirmedBy: 'admin' } });
    dispatch({
      type: 'ADD_AUDIT', payload: { id: generateId(), action: 'admin_confirm', timestamp: new Date().toISOString(), details: `Admin force-confirmed scores for matchup ${matchupId}`, userId: 'admin' }
    });
  };

  const handleResetMatchup = (matchupId: string) => {
    if (confirm('Reset this matchup to scheduled? All scores will be cleared.')) {
      const matchup = state.matchups.find(m => m.id === matchupId);
      if (matchup) {
        dispatch({ type: 'UPDATE_MATCHUP', payload: { ...matchup, status: 'scheduled', games: [], submittedBy: null, confirmedBy: null, disputeNote: null } });
        dispatch({
          type: 'ADD_AUDIT', payload: { id: generateId(), action: 'admin_reset', timestamp: new Date().toISOString(), details: `Admin reset matchup ${matchupId} to scheduled`, userId: 'admin' }
        });
      }
    }
  };

  const handleSetWeek = (week: number) => {
    dispatch({ type: 'SET_WEEK', payload: week });
    dispatch({
      type: 'ADD_AUDIT', payload: { id: generateId(), action: 'set_week', timestamp: new Date().toISOString(), details: `Current week set to ${week}`, userId: 'admin' }
    });
  };

  const handleResetAll = () => {
    if (confirm('This will reset ALL data to the initial seed state. Are you sure?')) {
      localStorage.removeItem('picklepal_state');
      window.location.reload();
    }
  };

  if (!state.isAdmin) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <h2 className="text-2xl font-medium text-gray-900 mb-2">Admin Access Required</h2>
        <p className="text-gray-600 mb-4">Turn on Admin in the header to access admin features.</p>
        <p className="text-sm text-gray-500">Note: In this demo, admin mode is toggled without authentication.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-gray-900">Admin Panel</h1>
        <p className="text-gray-600 text-sm mt-1">Manage league settings, resolve disputes, and monitor activity</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-200 overflow-x-auto">
        {(Object.keys(tabLabels) as (keyof typeof tabLabels)[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-1 pb-3 -mb-px text-sm font-medium uppercase tracking-wide border-b-2 whitespace-nowrap transition-colors ${
              activeTab === tab
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-2xl font-medium text-gray-900 tabular-nums">{state.teams.length}</div>
              <div className="text-xs text-gray-600 uppercase tracking-wide mt-1">Teams</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-2xl font-medium text-gray-900 tabular-nums">{state.players.length}</div>
              <div className="text-xs text-gray-600 uppercase tracking-wide mt-1">Players</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-2xl font-medium text-gray-900 tabular-nums">{state.matchups.filter(m => m.status === 'confirmed').length}</div>
              <div className="text-xs text-gray-600 uppercase tracking-wide mt-1">Completed</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-2xl font-medium text-gray-900 tabular-nums">{state.auditLog.length}</div>
              <div className="text-xs text-gray-600 uppercase tracking-wide mt-1">Audit Entries</div>
            </div>
          </div>

          {/* Pending Confirmations */}
          {pendingMatches.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-5">
              <h3 className="text-base font-medium text-amber-900 mb-3">Pending Confirmations ({pendingMatches.length})</h3>
              <div className="space-y-2">
                {pendingMatches.map(m => {
                  const home = getTeam(m.homeTeamId);
                  const away = getTeam(m.awayTeamId);
                  return (
                    <div key={m.id} className="flex items-center justify-between bg-white p-3 rounded border border-amber-100">
                      <div className="text-sm">
                        <span className="font-medium">{home?.name}</span> vs <span className="font-medium">{away?.name}</span>
                        <span className="text-gray-500 ml-2">(Week {m.weekNumber})</span>
                      </div>
                      <div className="flex gap-1">
                        <Link
                          to={`/matchups/${m.id}/confirm`}
                          className="px-2 py-1 rounded text-xs font-medium uppercase tracking-wide text-emerald-700 hover:bg-emerald-50 transition-colors"
                        >
                          Review
                        </Link>
                        <button
                          onClick={() => handleForceConfirm(m.id)}
                          className="px-2 py-1 rounded text-xs font-medium uppercase tracking-wide text-emerald-700 hover:bg-emerald-50 transition-colors"
                        >
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
            <div className="bg-red-50 border border-red-200 rounded-lg p-5">
              <h3 className="text-base font-medium text-red-900 mb-3">Disputed Scores ({disputedMatches.length})</h3>
              <div className="space-y-2">
                {disputedMatches.map(m => {
                  const home = getTeam(m.homeTeamId);
                  const away = getTeam(m.awayTeamId);
                  return (
                    <div key={m.id} className="bg-white p-3 rounded border border-red-100">
                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          <span className="font-medium">{home?.name}</span> vs <span className="font-medium">{away?.name}</span>
                          <span className="text-gray-500 ml-2">(Week {m.weekNumber})</span>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleForceConfirm(m.id)}
                            className="px-2 py-1 rounded text-xs font-medium uppercase tracking-wide text-emerald-700 hover:bg-emerald-50 transition-colors"
                          >
                            Confirm as Admin
                          </button>
                          <button
                            onClick={() => handleResetMatchup(m.id)}
                            className="px-2 py-1 rounded text-xs font-medium uppercase tracking-wide text-gray-600 hover:bg-gray-100 transition-colors"
                          >
                            Reset
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-red-700 mt-1">Note: {m.disputeNote}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* All Matchups Status */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h3 className="text-base font-medium text-gray-900 mb-3">All Matchups</h3>
            <div className="space-y-2">
              {state.matchups.map(m => {
                const home = getTeam(m.homeTeamId);
                const away = getTeam(m.awayTeamId);
                return (
                  <div key={m.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="text-sm">
                      <span className="text-gray-500 text-xs mr-2 tabular-nums">W{m.weekNumber}</span>
                      <span className="font-medium">{home?.name}</span>
                      <span className="text-gray-400 mx-1">vs</span>
                      <span className="font-medium">{away?.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${getStatusColor(m.status)}`}>
                        {getStatusLabel(m.status)}
                      </span>
                      <button
                        onClick={() => handleResetMatchup(m.id)}
                        className="px-2 py-1 rounded text-xs font-medium uppercase tracking-wide text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        Reset
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
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-base font-medium text-gray-900">Audit Log</h3>
            <p className="text-xs text-gray-600">All actions recorded in the system</p>
          </div>
          {state.auditLog.length === 0 ? (
            <div className="p-8 text-center text-gray-600 text-sm">No audit entries yet</div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
              {state.auditLog.map(entry => (
                <div key={entry.id} className="px-4 py-3">
                  <p className="text-sm text-gray-900">{entry.details}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(entry.timestamp).toLocaleString()} • by {entry.userId}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'tokens' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-base font-medium text-gray-900">Confirmation Tokens</h3>
            <p className="text-xs text-gray-600">Tokens generated for score confirmations</p>
          </div>
          {state.tokens.length === 0 ? (
            <div className="p-8 text-center text-gray-600 text-sm">No tokens generated yet. Submit scores to generate tokens.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {state.tokens.map(token => {
                const matchup = state.matchups.find(m => m.id === token.matchupId);
                const home = getTeam(matchup?.homeTeamId || '');
                const away = getTeam(matchup?.awayTeamId || '');
                return (
                  <div key={token.id} className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{home?.name} vs {away?.name}</p>
                        <p className="text-xs text-gray-600 font-mono mt-1">Token: {token.token.substring(0, 20)}...</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${token.used ? 'bg-gray-100 text-gray-600' : 'bg-emerald-100 text-emerald-700'}`}>
                          {token.used ? 'Used' : 'Active'}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">Expires: {new Date(token.expiresAt).toLocaleDateString()}</p>
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
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h3 className="text-base font-medium text-gray-900 mb-4">Season Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="current-week">Current week</label>
                <div className="flex items-center gap-3">
                  <select
                    id="current-week"
                    value={state.currentWeek}
                    onChange={e => handleSetWeek(parseInt(e.target.value))}
                    className="px-3 py-2 text-sm bg-white border border-gray-300 rounded outline-none transition-shadow focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(w => <option key={w} value={w}>Week {w}</option>)}
                  </select>
                  <span className="text-sm text-gray-600">Set the current active week</span>
                </div>
              </div>
              <div>
                <span className="block text-sm font-medium text-gray-700 mb-1.5">Season name</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-900">{state.seasonName}</span>
                  <span className="text-xs text-gray-500">(Read-only in demo)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h3 className="text-base font-medium text-gray-900 mb-4">Quick Links</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <Link to="/teams" className="p-3 rounded border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                Manage Teams
              </Link>
              <Link to="/players" className="p-3 rounded border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                Manage Players
              </Link>
              <Link to="/matchups" className="p-3 rounded border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                Manage Matchups
              </Link>
              <Link to="/rankings" className="p-3 rounded border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                View Rankings
              </Link>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-5">
            <h3 className="text-base font-medium text-red-900 mb-2">Danger Zone</h3>
            <p className="text-sm text-red-700 mb-3">Reset all data to initial state. This cannot be undone.</p>
            <button
              onClick={handleResetAll}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium uppercase tracking-wide transition-colors"
            >
              Reset All Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
