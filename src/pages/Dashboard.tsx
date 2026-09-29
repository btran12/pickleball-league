import { useLeague } from '../context/LeagueContext';
import { Link } from 'react-router-dom';
import { getStatusColor, getStatusLabel, formatDate, calculateTeamStandings } from '../utils/helpers';

export default function Dashboard() {
  const { state, league, getTeam, getMatchupsForWeek } = useLeague();
  const standings = calculateTeamStandings(league.teams, league.matchups);
  const currentWeekMatchups = getMatchupsForWeek(league.currentWeek);
  const pendingMatchups = league.matchups.filter(m => m.status === 'score_submitted' || m.status === 'disputed');

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 md:p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              {league.isDemo ? '🎮 Demo League' : `🏆 ${league.name}`}
            </h1>
            <p className="text-emerald-100 mt-1">
              {league.seasonName} • Week {league.currentWeek} • {league.teams.length} Teams • {league.players.length} Players
            </p>
            {league.isDemo && (
              <p className="text-emerald-200 text-sm mt-2">
                This is a demo league for testing. Create your own league to get started!
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {league.isDemo && (
              <Link
                to="/new-league"
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg font-medium transition-all text-center"
              >
                ✨ Create Your League
              </Link>
            )}
            <Link
              to="/matchups"
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg font-medium transition-all text-center"
            >
              View This Week's Matches →
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon="👥" label="Teams" value={league.teams.length} color="blue" />
        <StatCard icon="🏓" label="Players" value={league.players.length} color="emerald" />
        <StatCard icon="⚔️" label="Matches Played" value={league.matchups.filter(m => m.status === 'confirmed').length} color="purple" />
        <StatCard icon="⏳" label="Pending Scores" value={pendingMatchups.length} color="amber" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* This Week's Matchups */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Week {league.currentWeek} Matchups</h2>
            <Link to="/matchups" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {currentWeekMatchups.length === 0 ? (
              <p className="text-gray-500 text-sm py-4 text-center">No matchups scheduled for this week</p>
            ) : (
              currentWeekMatchups.map((matchup: any) => {
                const homeTeam = getTeam(matchup.homeTeamId);
                const awayTeam = getTeam(matchup.awayTeamId);
                return (
                  <div key={matchup.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <span style={{ color: homeTeam?.color }}>{homeTeam?.name}</span>
                        <span className="text-gray-400">vs</span>
                        <span style={{ color: awayTeam?.color }}>{awayTeam?.name}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{matchup.courtLocation} • {formatDate(matchup.scheduledTime)}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(matchup.status)}`}>
                      {getStatusLabel(matchup.status)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Standings Preview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Team Standings</h2>
            <Link to="/rankings" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
              Full Rankings →
            </Link>
          </div>
          <div className="space-y-2">
            {standings.slice(0, 6).map((team: any, idx: number) => (
              <div key={team.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                  idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                  idx === 1 ? 'bg-gray-100 text-gray-600' :
                  idx === 2 ? 'bg-orange-100 text-orange-700' :
                  'bg-gray-50 text-gray-500'
                }`}>
                  {idx + 1}
                </span>
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team.color }}></div>
                <span className="flex-1 text-sm font-medium text-gray-900">{team.name}</span>
                <span className="text-sm text-gray-500">{team.wins}W - {team.losses}L</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pending Actions */}
      {pendingMatchups.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-amber-800 mb-3">⚠️ Pending Actions</h2>
          <div className="space-y-2">
            {pendingMatchups.map((matchup: any) => {
              const homeTeam = getTeam(matchup.homeTeamId);
              const awayTeam = getTeam(matchup.awayTeamId);
              return (
                <div key={matchup.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-amber-100">
                  <div className="text-sm">
                    <span className="font-medium">{homeTeam?.name}</span>
                    <span className="text-gray-400 mx-2">vs</span>
                    <span className="font-medium">{awayTeam?.name}</span>
                    <span className="text-gray-500 ml-2">(Week {matchup.weekNumber})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(matchup.status)}`}>
                      {getStatusLabel(matchup.status)}
                    </span>
                    <Link
                      to={`/matchups/${matchup.id}/confirm`}
                      className="text-xs px-3 py-1 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-colors"
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
      {league.auditLog.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Recent Activity</h2>
          <div className="space-y-2">
            {league.auditLog.slice(0, 5).map((entry: any) => (
              <div key={entry.id} className="flex items-start gap-3 text-sm">
                <span className="text-gray-400 text-xs mt-0.5 whitespace-nowrap">
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

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-100',
    emerald: 'bg-emerald-50 border-emerald-100',
    purple: 'bg-purple-50 border-purple-100',
    amber: 'bg-amber-50 border-amber-100',
  };

  return (
    <div className={`p-4 rounded-xl border ${colorClasses[color]}`}>
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 font-medium">{label}</div>
    </div>
  );
}
