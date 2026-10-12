import { useState } from 'react';
import { useLeague } from '../context/LeagueContext';
import { calculateTeamStandings } from '../utils/helpers';

export default function Rankings() {
  const { state, getTeam } = useLeague();
  const [tab, setTab] = useState<'teams' | 'players'>('teams');

  const teamStandings = calculateTeamStandings(state.teams, state.matchups);

  const playerRankings = [...state.players]
    .sort((a, b) => b.rating - a.rating)
    .map((player, idx) => {
      const team = getTeam(player.teamId || '');
      const winRate = player.wins + player.losses > 0 ? Math.round((player.wins / (player.wins + player.losses)) * 100) : 0;
      return { ...player, rank: idx + 1, team, winRate };
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-gray-900">Rankings</h1>
        <p className="text-gray-600 text-sm mt-1">{state.seasonName} standings and player ratings</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-200">
        <button
          onClick={() => setTab('teams')}
          className={`px-1 pb-3 -mb-px text-sm font-medium uppercase tracking-wide border-b-2 transition-colors ${
            tab === 'teams'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Team Standings
        </button>
        <button
          onClick={() => setTab('players')}
          className={`px-1 pb-3 -mb-px text-sm font-medium uppercase tracking-wide border-b-2 transition-colors ${
            tab === 'players'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Player Rankings
        </button>
      </div>

      {tab === 'teams' ? (
        <div className="space-y-4">
          {/* Top 3 */}
          <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto">
            {teamStandings.slice(0, 3).map((team, idx) => (
              <div key={team.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden text-center">
                <div className="h-1" style={{ backgroundColor: team.color }}></div>
                <div className="p-4">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">
                    {idx === 0 ? '1st' : idx === 1 ? '2nd' : '3rd'}
                  </div>
                  <div className="font-medium text-sm text-gray-900 truncate mt-1">{team.name}</div>
                  <div className="text-xs text-gray-600 mt-1 tabular-nums">{team.wins}W - {team.losses}L</div>
                  <div className="text-lg font-medium text-gray-900 mt-1 tabular-nums">
                    {team.pointDiff > 0 ? '+' : ''}{team.pointDiff}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Full Standings Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wide">#</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wide">Team</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wide">W</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wide">L</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wide hidden sm:table-cell">PF</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wide hidden sm:table-cell">PA</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wide">Diff</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wide hidden md:table-cell">Win %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {teamStandings.map((team, idx) => {
                    const winRate = team.wins + team.losses > 0 ? Math.round((team.wins / (team.wins + team.losses)) * 100) : 0;
                    return (
                      <tr key={team.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-600 tabular-nums">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-gray-900">{team.name}</span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-900 tabular-nums">{team.wins}</td>
                        <td className="px-4 py-3 text-right text-sm text-gray-900 tabular-nums">{team.losses}</td>
                        <td className="px-4 py-3 text-right text-sm text-gray-700 hidden sm:table-cell tabular-nums">{team.pointsFor}</td>
                        <td className="px-4 py-3 text-right text-sm text-gray-700 hidden sm:table-cell tabular-nums">{team.pointsAgainst}</td>
                        <td className="px-4 py-3 text-right text-sm text-gray-900 tabular-nums">
                          {team.pointDiff > 0 ? '+' : ''}{team.pointDiff}
                        </td>
                        <td className="px-4 py-3 text-right hidden md:table-cell">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${winRate}%` }}></div>
                            </div>
                            <span className="text-xs text-gray-600 tabular-nums w-8">{winRate}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Top Players */}
          <div className="grid sm:grid-cols-3 gap-3">
            {playerRankings.slice(0, 3).map((player, idx) => (
              <div key={player.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
                <div className="text-xs text-gray-500 uppercase tracking-wide">
                  {idx === 0 ? '1st' : idx === 1 ? '2nd' : '3rd'}
                </div>
                <div className="font-medium text-gray-900 mt-1">{player.name}</div>
                {player.team && (
                  <span
                    className="inline-block text-xs font-medium px-2 py-0.5 rounded mt-1"
                    style={{ backgroundColor: player.team.color + '1a', color: player.team.color }}
                  >
                    {player.team.name}
                  </span>
                )}
                <div className="mt-2 text-2xl font-medium text-emerald-700 tabular-nums">{player.rating}</div>
                <div className="text-xs text-gray-600 tabular-nums">
                  {player.wins}W - {player.losses}L ({player.winRate}%)
                </div>
              </div>
            ))}
          </div>

          {/* Full Player Rankings Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wide">#</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wide">Player</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wide hidden sm:table-cell">Team</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wide">Rating</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wide">W/L</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wide hidden md:table-cell">Win %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {playerRankings.map((player) => (
                    <tr key={player.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-600 tabular-nums">{player.rank}</td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-gray-900">{player.name}</span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {player.team ? (
                          <span
                            className="inline-block text-xs font-medium px-2 py-0.5 rounded"
                            style={{ backgroundColor: player.team.color + '1a', color: player.team.color }}
                          >
                            {player.team.name}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-900 tabular-nums">{player.rating}</td>
                      <td className="px-4 py-3 text-right text-sm text-gray-700 tabular-nums">
                        {player.wins}&ndash;{player.losses}
                      </td>
                      <td className="px-4 py-3 text-right hidden md:table-cell">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${player.winRate}%` }}></div>
                          </div>
                          <span className="text-xs text-gray-600 tabular-nums w-8">{player.winRate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
