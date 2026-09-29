import { useState } from 'react';
import { useLeague } from '../context/LeagueContext';
import { calculateTeamStandings } from '../utils/helpers';

export default function Rankings() {
  const { league, getTeam } = useLeague();
  const [tab, setTab] = useState<'teams' | 'players'>('teams');

  const teamStandings = calculateTeamStandings(league.teams, league.matchups);
  const playerRankings = [...league.players]
    .sort((a: any, b: any) => b.rating - a.rating)
    .map((player: any, idx: number) => {
      const team = getTeam(player.teamId || '');
      const winRate = player.wins + player.losses > 0 ? Math.round((player.wins / (player.wins + player.losses)) * 100) : 0;
      return { ...player, rank: idx + 1, team, winRate };
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rankings</h1>
        <p className="text-gray-500 text-sm mt-1">{league.seasonName} standings and player ratings</p>
      </div>
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button onClick={() => setTab('teams')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === 'teams' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>🏆 Team Standings</button>
        <button onClick={() => setTab('players')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === 'players' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>🏓 Player Rankings</button>
      </div>
      {tab === 'teams' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto">
            {teamStandings.slice(0, 3).map((team: any, idx: number) => (
              <div key={team.id} className={`text-center ${idx === 0 ? 'order-2' : idx === 1 ? 'order-1' : 'order-3'}`}>
                <div className={`rounded-xl p-4 ${idx === 0 ? 'bg-gradient-to-b from-yellow-50 to-yellow-100 border-2 border-yellow-300' : idx === 1 ? 'bg-gradient-to-b from-gray-50 to-gray-100 border border-gray-300' : 'bg-gradient-to-b from-orange-50 to-orange-100 border border-orange-200'}`}>
                  <div className={`text-3xl mb-1 ${idx === 0 ? 'mt-0' : 'mt-4'}`}>{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</div>
                  <div className="w-8 h-8 rounded-full mx-auto mb-2" style={{ backgroundColor: team.color }}></div>
                  <div className="font-semibold text-sm text-gray-900 truncate">{team.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{team.wins}W - {team.losses}L</div>
                  <div className="text-lg font-bold text-gray-900 mt-1">{team.pointDiff > 0 ? '+' : ''}{team.pointDiff}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">#</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Team</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">W</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">L</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">PF</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">PA</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Diff</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Win %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {teamStandings.map((team: any, idx: number) => {
                    const winRate = team.wins + team.losses > 0 ? Math.round((team.wins / (team.wins + team.losses)) * 100) : 0;
                    return (
                      <tr key={team.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3"><span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : idx === 1 ? 'bg-gray-100 text-gray-600' : idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-50 text-gray-500'}`}>{idx + 1}</span></td>
                        <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: team.color }}></div><span className="font-medium text-gray-900 text-sm">{team.name}</span></div></td>
                        <td className="px-4 py-3 text-center text-sm font-semibold text-green-600">{team.wins}</td>
                        <td className="px-4 py-3 text-center text-sm font-semibold text-red-600">{team.losses}</td>
                        <td className="px-4 py-3 text-center text-sm text-gray-600 hidden sm:table-cell">{team.pointsFor}</td>
                        <td className="px-4 py-3 text-center text-sm text-gray-600 hidden sm:table-cell">{team.pointsAgainst}</td>
                        <td className="px-4 py-3 text-center"><span className={`text-sm font-semibold ${team.pointDiff > 0 ? 'text-emerald-600' : team.pointDiff < 0 ? 'text-red-600' : 'text-gray-500'}`}>{team.pointDiff > 0 ? '+' : ''}{team.pointDiff}</span></td>
                        <td className="px-4 py-3 text-center hidden md:table-cell"><div className="flex items-center justify-center gap-2"><div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${winRate}%` }}></div></div><span className="text-xs text-gray-500">{winRate}%</span></div></td>
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
          <div className="grid sm:grid-cols-3 gap-3">
            {playerRankings.slice(0, 3).map((player: any, idx: number) => (
              <div key={player.id} className={`bg-white rounded-xl shadow-sm border p-4 text-center ${idx === 0 ? 'border-yellow-300 bg-gradient-to-b from-yellow-50 to-white' : idx === 1 ? 'border-gray-300 bg-gradient-to-b from-gray-50 to-white' : 'border-orange-200 bg-gradient-to-b from-orange-50 to-white'}`}>
                <div className="text-3xl mb-2">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</div>
                <div className="text-3xl mb-1">{player.avatar}</div>
                <div className="font-semibold text-gray-900">{player.name}</div>
                {player.team && (<div className="flex items-center justify-center gap-1 mt-1"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: player.team.color }}></div><span className="text-xs text-gray-500">{player.team.name}</span></div>)}
                <div className="mt-2 text-2xl font-bold text-emerald-600">{player.rating}</div>
                <div className="text-xs text-gray-500">{player.wins}W - {player.losses}L ({player.winRate}%)</div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">#</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Player</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Team</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Rating</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">W/L</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Win %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {playerRankings.map((player: any) => (
                    <tr key={player.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3"><span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${player.rank <= 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-50 text-gray-500'}`}>{player.rank}</span></td>
                      <td className="px-4 py-3"><div className="flex items-center gap-2"><span className="text-xl">{player.avatar}</span><span className="font-medium text-gray-900 text-sm">{player.name}</span></div></td>
                      <td className="px-4 py-3 hidden sm:table-cell">{player.team ? (<span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full" style={{ backgroundColor: player.team.color + '20', color: player.team.color }}><span className="w-2 h-2 rounded-full" style={{ backgroundColor: player.team.color }}></span>{player.team.name}</span>) : (<span className="text-xs text-gray-400">—</span>)}</td>
                      <td className="px-4 py-3 text-center"><span className="text-sm font-bold text-emerald-600">{player.rating}</span></td>
                      <td className="px-4 py-3 text-center text-sm"><span className="text-green-600 font-medium">{player.wins}</span><span className="text-gray-300 mx-1">-</span><span className="text-red-600 font-medium">{player.losses}</span></td>
                      <td className="px-4 py-3 text-center hidden md:table-cell"><div className="flex items-center justify-center gap-2"><div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${player.winRate}%` }}></div></div><span className="text-xs text-gray-500">{player.winRate}%</span></div></td>
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
