import { useState } from 'react';
import { useLeague } from '../context/LeagueContext';
import { getStatusColor, getStatusLabel, formatDate, formatTime, generateId, generateToken } from '../utils/helpers';
import { Link } from 'react-router-dom';

export default function Matchups() {
  const { state, league, dispatch, getTeam, getTeamPlayers, getPlayer } = useLeague();
  const [selectedWeek, setSelectedWeek] = useState(league.currentWeek);
  const [showScoreForm, setShowScoreForm] = useState<string | null>(null);
  const [gameScores, setGameScores] = useState<{ homeScore: string; awayScore: string; homeP1: string; homeP2: string; awayP1: string; awayP2: string }[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');

  const weeks = [...new Set(league.matchups.map((m: any) => m.weekNumber))].sort((a: number, b: number) => a - b);
  const weekMatchups = league.matchups.filter((m: any) => m.weekNumber === selectedWeek);

  const handleStartScoreEntry = (matchupId: string) => {
    const matchup = league.matchups.find((m: any) => m.id === matchupId);
    if (!matchup) return;
    const homePlayers = getTeamPlayers(matchup.homeTeamId);
    const awayPlayers = getTeamPlayers(matchup.awayTeamId);
    if (matchup.games.length > 0) {
      setGameScores(matchup.games.map((g: any) => ({
        homeScore: g.homeScore?.toString() || '', awayScore: g.awayScore?.toString() || '',
        homeP1: g.homePlayer1Id, homeP2: g.homePlayer2Id, awayP1: g.awayPlayer1Id, awayP2: g.awayPlayer2Id,
      })));
    } else {
      setGameScores([
        { homeScore: '', awayScore: '', homeP1: homePlayers[0]?.id || '', homeP2: homePlayers[1]?.id || '', awayP1: awayPlayers[0]?.id || '', awayP2: awayPlayers[1]?.id || '' },
        { homeScore: '', awayScore: '', homeP1: homePlayers[2]?.id || homePlayers[0]?.id || '', homeP2: homePlayers[3]?.id || homePlayers[1]?.id || '', awayP1: awayPlayers[2]?.id || awayPlayers[0]?.id || '', awayP2: awayPlayers[3]?.id || awayPlayers[1]?.id || '' },
      ]);
    }
    setShowScoreForm(matchupId);
  };

  const handleSubmitScores = (matchupId: string) => {
    const matchup = league.matchups.find((m: any) => m.id === matchupId);
    if (!matchup) return;
    const games = gameScores.map(gs => ({
      id: generateId(), matchupId, homePlayer1Id: gs.homeP1, homePlayer2Id: gs.homeP2,
      awayPlayer1Id: gs.awayP1, awayPlayer2Id: gs.awayP2,
      homeScore: parseInt(gs.homeScore) || 0, awayScore: parseInt(gs.awayScore) || 0,
    }));
    dispatch({ type: 'SUBMIT_SCORES', payload: { matchupId, games, submittedBy: selectedPlayer || 'admin' } });
    const token = generateToken();
    dispatch({ type: 'ADD_TOKEN', payload: { id: generateId(), matchupId, token, expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), used: false } });
    dispatch({ type: 'ADD_AUDIT', payload: { id: generateId(), action: 'submit_scores', timestamp: new Date().toISOString(), details: `Scores submitted for ${getTeam(matchup.homeTeamId)?.name} vs ${getTeam(matchup.awayTeamId)?.name} (Week ${matchup.weekNumber})`, userId: selectedPlayer || 'admin' } });
    setShowScoreForm(null);
    setGameScores([]);
  };

  const addGame = () => {
    const matchup = league.matchups.find((m: any) => m.id === showScoreForm);
    if (!matchup) return;
    const homePlayers = getTeamPlayers(matchup.homeTeamId);
    const awayPlayers = getTeamPlayers(matchup.awayTeamId);
    setGameScores([...gameScores, { homeScore: '', awayScore: '', homeP1: homePlayers[0]?.id || '', homeP2: homePlayers[1]?.id || '', awayP1: awayPlayers[0]?.id || '', awayP2: awayPlayers[1]?.id || '' }]);
  };

  const removeGame = (idx: number) => { setGameScores(gameScores.filter((_, i) => i !== idx)); };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Weekly Matchups</h1>
          <p className="text-gray-500 text-sm mt-1">Schedule, scores, and confirmations</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Week:</label>
          <select value={selectedWeek} onChange={e => setSelectedWeek(parseInt(e.target.value))} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none">
            {weeks.map((w: number) => <option key={w} value={w}>Week {w}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <label className="block text-sm font-medium text-blue-800 mb-2">Submitting as:</label>
        <select value={selectedPlayer} onChange={e => setSelectedPlayer(e.target.value)} className="w-full sm:w-auto px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
          <option value="admin">Admin</option>
          {league.players.map((p: any) => <option key={p.id} value={p.id}>{p.name} ({getTeam(p.teamId || '')?.name || 'No team'})</option>)}
        </select>
      </div>

      <div className="space-y-4">
        {weekMatchups.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">No matchups scheduled for Week {selectedWeek}</div>
        ) : (
          weekMatchups.map((matchup: any) => {
            const homeTeam = getTeam(matchup.homeTeamId);
            const awayTeam = getTeam(matchup.awayTeamId);
            const canEnterScores = matchup.status === 'scheduled' || matchup.status === 'score_submitted' || state.isAdmin;
            return (
              <div key={matchup.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: homeTeam?.color }}></div><span className="font-semibold text-gray-900">{homeTeam?.name}</span></div>
                      <span className="text-gray-400 font-medium">vs</span>
                      <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: awayTeam?.color }}></div><span className="font-semibold text-gray-900">{awayTeam?.name}</span></div>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusColor(matchup.status)}`}>{getStatusLabel(matchup.status)}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                    <span>📍 {matchup.courtLocation}</span><span>📅 {formatDate(matchup.scheduledTime)}</span><span>🕐 {formatTime(matchup.scheduledTime)}</span>
                  </div>
                </div>
                {matchup.games.length > 0 && (
                  <div className="border-t border-gray-100 px-4 sm:px-5 py-3 bg-gray-50">
                    <div className="space-y-2">
                      {matchup.games.map((game: any, idx: number) => {
                        const hp1 = getPlayer(game.homePlayer1Id); const hp2 = getPlayer(game.homePlayer2Id);
                        const ap1 = getPlayer(game.awayPlayer1Id); const ap2 = getPlayer(game.awayPlayer2Id);
                        const homeWon = (game.homeScore || 0) > (game.awayScore || 0);
                        return (
                          <div key={game.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-100">
                            <div className="flex-1"><div className={`text-sm ${homeWon ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>{hp1?.avatar} {hp1?.name} & {hp2?.avatar} {hp2?.name}</div></div>
                            <div className="px-4 text-center"><span className={`text-lg font-bold ${homeWon ? 'text-emerald-600' : 'text-gray-400'}`}>{game.homeScore}</span><span className="text-gray-300 mx-1">-</span><span className={`text-lg font-bold ${!homeWon ? 'text-emerald-600' : 'text-gray-400'}`}>{game.awayScore}</span></div>
                            <div className="flex-1 text-right"><div className={`text-sm ${!homeWon ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>{ap1?.avatar} {ap1?.name} & {ap2?.avatar} {ap2?.name}</div></div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div className="border-t border-gray-100 px-4 sm:px-5 py-3 flex flex-wrap gap-2">
                  {canEnterScores && (<button onClick={() => handleStartScoreEntry(matchup.id)} className="text-sm px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium">{matchup.games.length > 0 ? '✏️ Edit Scores' : '📝 Enter Scores'}</button>)}
                  {matchup.status === 'score_submitted' && (<Link to={`/matchups/${matchup.id}/confirm`} className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">✓ Review & Confirm</Link>)}
                  {matchup.status === 'disputed' && (<div className="text-sm text-red-600 flex items-center gap-1">⚠️ Disputed: {matchup.disputeNote}</div>)}
                </div>
              </div>
            );
          })
        )}
      </div>

      {showScoreForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Enter Scores - {getTeam(league.matchups.find((m: any) => m.id === showScoreForm)?.homeTeamId || '')?.name} vs {getTeam(league.matchups.find((m: any) => m.id === showScoreForm)?.awayTeamId || '')?.name}</h2>
            <div className="space-y-4">
              {gameScores.map((game, idx) => {
                const matchup = league.matchups.find((m: any) => m.id === showScoreForm);
                if (!matchup) return null;
                const homePlayers = getTeamPlayers(matchup.homeTeamId);
                const awayPlayers = getTeamPlayers(matchup.awayTeamId);
                return (
                  <div key={idx} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">Game {idx + 1}</span>
                      {gameScores.length > 1 && (<button onClick={() => removeGame(idx)} className="text-xs text-red-500 hover:text-red-700">Remove</button>)}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Home Players</label>
                        <select value={game.homeP1} onChange={e => { const ns = [...gameScores]; ns[idx].homeP1 = e.target.value; setGameScores(ns); }} className="w-full text-sm px-2 py-1.5 border border-gray-300 rounded mb-1">{homePlayers.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                        <select value={game.homeP2} onChange={e => { const ns = [...gameScores]; ns[idx].homeP2 = e.target.value; setGameScores(ns); }} className="w-full text-sm px-2 py-1.5 border border-gray-300 rounded">{homePlayers.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Away Players</label>
                        <select value={game.awayP1} onChange={e => { const ns = [...gameScores]; ns[idx].awayP1 = e.target.value; setGameScores(ns); }} className="w-full text-sm px-2 py-1.5 border border-gray-300 rounded mb-1">{awayPlayers.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                        <select value={game.awayP2} onChange={e => { const ns = [...gameScores]; ns[idx].awayP2 = e.target.value; setGameScores(ns); }} className="w-full text-sm px-2 py-1.5 border border-gray-300 rounded">{awayPlayers.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div><label className="text-xs text-gray-500 mb-1 block">Home Score</label><input type="number" min="0" max="21" value={game.homeScore} onChange={e => { const ns = [...gameScores]; ns[idx].homeScore = e.target.value; setGameScores(ns); }} className="w-full text-center text-lg font-bold px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" /></div>
                      <div><label className="text-xs text-gray-500 mb-1 block">Away Score</label><input type="number" min="0" max="21" value={game.awayScore} onChange={e => { const ns = [...gameScores]; ns[idx].awayScore = e.target.value; setGameScores(ns); }} className="w-full text-center text-lg font-bold px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" /></div>
                    </div>
                  </div>
                );
              })}
              <button onClick={addGame} className="w-full text-sm py-2 border border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-emerald-500 hover:text-emerald-600 transition-colors">+ Add Game</button>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => handleSubmitScores(showScoreForm)} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-medium transition-colors">Submit Scores</button>
              <button onClick={() => { setShowScoreForm(null); setGameScores([]); }} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg font-medium transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
