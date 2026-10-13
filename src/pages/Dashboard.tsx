import { useLeague } from '../context/LeagueContext';
import { Link } from 'react-router-dom';
import { getStatusColor, getStatusLabel, formatDate, calculateTeamStandings } from '../utils/helpers';

export default function Dashboard() {
  const { state, getTeam, getMatchupsForWeek } = useLeague();
  const standings = calculateTeamStandings(state.teams, state.matchups);
  const currentWeekMatchups = getMatchupsForWeek(state.currentWeek);
  const pendingMatchups = state.matchups.filter(m => m.status === 'score_submitted' || m.status === 'disputed');

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-emerald-700 rounded-lg p-6 md:p-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-medium">Welcome to Zero 2 League</h1>
            <p className="text-emerald-100 mt-1 text-sm">
              {state.seasonName} • Week {state.currentWeek} • {state.teams.length} Teams • {state.players.length} Players
            </p>
          </div>
          <Link
            to="/matchups"
            className="self-start md:self-auto bg-white text-emerald-800 hover:bg-emerald-50 px-4 py-2 rounded text-sm font-medium uppercase tracking-wide transition-colors text-center"
          >
            View This Week's Matches
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Teams" value={state.teams.length} />
        <StatCard label="Players" value={state.players.length} />
        <StatCard label="Matches Played" value={state.matchups.filter(m => m.status === 'confirmed').length} />
        <StatCard label="Pending Scores" value={pendingMatchups.length} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* This Week's Matchups */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-medium text-gray-900">Week {state.currentWeek} Matchups</h2>
            <Link to="/matchups" className="text-sm font-medium uppercase tracking-wide text-emerald-700 hover:text-emerald-800">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {currentWeekMatchups.length === 0 ? (
              <p className="text-gray-600 text-sm py-4 text-center">No matchups scheduled for this week</p>
            ) : (
              currentWeekMatchups.map(matchup => {
                const homeTeam = getTeam(matchup.homeTeamId);
                const awayTeam = getTeam(matchup.awayTeamId);
                return (
                  <div key={matchup.id} className="flex items-center justify-between p-3 rounded bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <span style={{ color: homeTeam?.color }}>{homeTeam?.name}</span>
                        <span className="text-gray-400">vs</span>
                        <span style={{ color: awayTeam?.color }}>{awayTeam?.name}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5">{matchup.courtLocation} • {formatDate(matchup.scheduledTime)}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${getStatusColor(matchup.status)}`}>
                      {getStatusLabel(matchup.status)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Standings Preview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-medium text-gray-900">Team Standings</h2>
            <Link to="/rankings" className="text-sm font-medium uppercase tracking-wide text-emerald-700 hover:text-emerald-800">
              Full Rankings
            </Link>
          </div>
          <div className="space-y-1">
            {standings.slice(0, 6).map((team, idx) => (
              <div key={team.id} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 transition-colors">
                <span className="w-5 text-xs text-gray-500 tabular-nums">{idx + 1}</span>
                <span className="flex-1 text-sm font-medium text-gray-900">{team.name}</span>
                <span className="text-sm text-gray-600 tabular-nums">{team.wins}W - {team.losses}L</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pending Actions */}
      {pendingMatchups.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-5">
          <h2 className="text-base font-medium text-amber-900 mb-3">Pending Actions</h2>
          <div className="space-y-2">
            {pendingMatchups.map(matchup => {
              const homeTeam = getTeam(matchup.homeTeamId);
              const awayTeam = getTeam(matchup.awayTeamId);
              return (
                <div key={matchup.id} className="flex items-center justify-between bg-white p-3 rounded border border-amber-100">
                  <div className="text-sm">
                    <span className="font-medium">{homeTeam?.name}</span>
                    <span className="text-gray-400 mx-2">vs</span>
                    <span className="font-medium">{awayTeam?.name}</span>
                    <span className="text-gray-500 ml-2">(Week {matchup.weekNumber})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${getStatusColor(matchup.status)}`}>
                      {getStatusLabel(matchup.status)}
                    </span>
                    <Link
                      to={`/matchups/${matchup.id}/confirm`}
                      className="text-xs px-2 py-1 rounded font-medium uppercase tracking-wide text-emerald-700 hover:bg-emerald-50 transition-colors"
                    >
                      Review
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {state.auditLog.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h2 className="text-base font-medium text-gray-900 mb-3">Recent Activity</h2>
          <div className="space-y-2">
            {state.auditLog.slice(0, 5).map(entry => (
              <div key={entry.id} className="flex items-start gap-3 text-sm">
                <span className="text-gray-500 text-xs mt-0.5 whitespace-nowrap tabular-nums">
                  {new Date(entry.timestamp).toLocaleString()}
                </span>
                <span className="text-gray-700">{entry.details}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-4 rounded-lg border border-gray-200 bg-white">
      <div className="text-2xl font-medium text-gray-900 tabular-nums">{value}</div>
      <div className="text-xs text-gray-600 font-medium uppercase tracking-wide mt-1">{label}</div>
    </div>
  );
}
