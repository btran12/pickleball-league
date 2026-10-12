import { useState } from 'react';
import { useLeague } from '../context/LeagueContext';
import { getStatusColor, getStatusLabel, formatDate, formatTime, generateId, generateToken } from '../utils/helpers';
import { Link } from 'react-router-dom';

export default function Matchups() {
  const { state, dispatch, getTeam, getTeamPlayers, getPlayer } = useLeague();
  const [selectedWeek, setSelectedWeek] = useState(state.currentWeek);
  const [showScoreForm, setShowScoreForm] = useState<string | null>(null);
  const [gameScores, setGameScores] = useState<{ homeScore: string; awayScore: string; homeP1: string; homeP2: string; awayP1: string; awayP2: string }[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');

  const weeks = [...new Set(state.matchups.map(m => m.weekNumber))].sort((a, b) => a - b);
  const weekMatchups = state.matchups.filter(m => m.weekNumber === selectedWeek);

  const handleStartScoreEntry = (matchupId: string) => {
    const matchup = state.matchups.find(m => m.id === matchupId);
    if (!matchup) return;

    const homePlayers = getTeamPlayers(matchup.homeTeamId);
    const awayPlayers = getTeamPlayers(matchup.awayTeamId);

    if (matchup.games.length > 0) {
      setGameScores(matchup.games.map(g => ({
        homeScore: g.homeScore?.toString() || '',
        awayScore: g.awayScore?.toString() || '',
        homeP1: g.homePlayer1Id,
        homeP2: g.homePlayer2Id,
        awayP1: g.awayPlayer1Id,
        awayP2: g.awayPlayer2Id,
      })));
    } else {
      // Default: 2 doubles games
      setGameScores([
        { homeScore: '', awayScore: '', homeP1: homePlayers[0]?.id || '', homeP2: homePlayers[1]?.id || '', awayP1: awayPlayers[0]?.id || '', awayP2: awayPlayers[1]?.id || '' },
        { homeScore: '', awayScore: '', homeP1: homePlayers[2]?.id || homePlayers[0]?.id || '', homeP2: homePlayers[3]?.id || homePlayers[1]?.id || '', awayP1: awayPlayers[2]?.id || awayPlayers[0]?.id || '', awayP2: awayPlayers[3]?.id || awayPlayers[1]?.id || '' },
      ]);
    }
    setShowScoreForm(matchupId);
  };

  const handleSubmitScores = (matchupId: string) => {
    const matchup = state.matchups.find(m => m.id === matchupId);
    if (!matchup) return;

    const games = gameScores.map(gs => ({
      id: generateId(),
      matchupId,
      homePlayer1Id: gs.homeP1,
      homePlayer2Id: gs.homeP2,
      awayPlayer1Id: gs.awayP1,
      awayPlayer2Id: gs.awayP2,
      homeScore: parseInt(gs.homeScore) || 0,
      awayScore: parseInt(gs.awayScore) || 0,
    }));

    dispatch({ type: 'SUBMIT_SCORES', payload: { matchupId, games, submittedBy: selectedPlayer || 'admin' } });

    // Generate confirmation token
    const token = generateToken();
    dispatch({
      type: 'ADD_TOKEN',
      payload: {
        id: generateId(),
        matchupId,
        token,
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        used: false,
      }
    });

    dispatch({
      type: 'ADD_AUDIT',
      payload: {
        id: generateId(),
        action: 'submit_scores',
        timestamp: new Date().toISOString(),
        details: `Scores submitted for ${getTeam(matchup.homeTeamId)?.name} vs ${getTeam(matchup.awayTeamId)?.name} (Week ${matchup.weekNumber})`,
        userId: selectedPlayer || 'admin',
      }
    });

    setShowScoreForm(null);
    setGameScores([]);
  };

  const addGame = () => {
    const matchup = state.matchups.find(m => m.id === showScoreForm);
    if (!matchup) return;
    const homePlayers = getTeamPlayers(matchup.homeTeamId);
    const awayPlayers = getTeamPlayers(matchup.awayTeamId);
    setGameScores([...gameScores, { homeScore: '', awayScore: '', homeP1: homePlayers[0]?.id || '', homeP2: homePlayers[1]?.id || '', awayP1: awayPlayers[0]?.id || '', awayP2: awayPlayers[1]?.id || '' }]);
  };

  const removeGame = (idx: number) => {
    setGameScores(gameScores.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium text-gray-900">Weekly Matchups</h1>
          <p className="text-gray-600 text-sm mt-1">Schedule, scores, and confirmations</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600" htmlFor="week-select">Week</label>
          <select
            id="week-select"
            value={selectedWeek}
            onChange={e => setSelectedWeek(parseInt(e.target.value))}
            className="px-3 py-2 text-sm bg-white border border-gray-300 rounded outline-none transition-shadow focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
          >
            {weeks.map(w => <option key={w} value={w}>Week {w}</option>)}
          </select>
        </div>
      </div>

      {/* Player selector for score submission */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 mb-1.5" htmlFor="submitter-select">
          Submitting as
        </label>
        <select
          id="submitter-select"
          value={selectedPlayer}
          onChange={e => setSelectedPlayer(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 text-sm bg-white border border-gray-300 rounded outline-none transition-shadow focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
        >
          <option value="admin">Admin</option>
          {state.players.map(p => <option key={p.id} value={p.id}>{p.name} ({getTeam(p.teamId || '')?.name || 'No team'})</option>)}
        </select>
      </div>

      {/* Matchups List */}
      <div className="space-y-4">
        {weekMatchups.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-sm text-gray-600">
            No matchups scheduled for Week {selectedWeek}
          </div>
        ) : (
          weekMatchups.map(matchup => {
            const homeTeam = getTeam(matchup.homeTeamId);
            const awayTeam = getTeam(matchup.awayTeamId);
            const canEnterScores = matchup.status === 'scheduled' || matchup.status === 'score_submitted' || state.isAdmin;

            return (
              <div key={matchup.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Matchup Header */}
                <div className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-gray-900">{homeTeam?.name}</span>
                      <span className="text-gray-400">vs</span>
                      <span className="font-medium text-gray-900">{awayTeam?.name}</span>
                    </div>
                    <span className={`self-start text-xs px-2 py-0.5 rounded font-medium ${getStatusColor(matchup.status)}`}>
                      {getStatusLabel(matchup.status)}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-gray-600">
                    {matchup.courtLocation} • {formatDate(matchup.scheduledTime)} • {formatTime(matchup.scheduledTime)}
                  </p>
                </div>

                {/* Games / Scores */}
                {matchup.games.length > 0 && (
                  <div className="border-t border-gray-200 px-4 sm:px-5 py-3 bg-gray-50">
                    <div className="space-y-2">
                      {matchup.games.map((game, idx) => {
                        const hp1 = getPlayer(game.homePlayer1Id);
                        const hp2 = getPlayer(game.homePlayer2Id);
                        const ap1 = getPlayer(game.awayPlayer1Id);
                        const ap2 = getPlayer(game.awayPlayer2Id);
                        const homeWon = (game.homeScore || 0) > (game.awayScore || 0);

                        return (
                          <div key={game.id} className="flex items-center justify-between bg-white rounded p-3 border border-gray-200">
                            <div className="flex-1">
                              <div className={`text-sm ${homeWon ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                                {hp1?.name} & {hp2?.name}
                              </div>
                            </div>
                            <div className="px-4 text-center tabular-nums">
                              <span className={`text-lg font-medium ${homeWon ? 'text-emerald-700' : 'text-gray-500'}`}>
                                {game.homeScore}
                              </span>
                              <span className="text-gray-300 mx-1">&ndash;</span>
                              <span className={`text-lg font-medium ${!homeWon ? 'text-emerald-700' : 'text-gray-500'}`}>
                                {game.awayScore}
                              </span>
                            </div>
                            <div className="flex-1 text-right">
                              <div className={`text-sm ${!homeWon ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                                {ap1?.name} & {ap2?.name}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="border-t border-gray-200 px-4 sm:px-5 py-3 flex flex-wrap items-center gap-2">
                  {canEnterScores && (
                    <button
                      onClick={() => handleStartScoreEntry(matchup.id)}
                      className="px-3 py-1.5 rounded text-sm font-medium uppercase tracking-wide bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                    >
                      {matchup.games.length > 0 ? 'Edit Scores' : 'Enter Scores'}
                    </button>
                  )}
                  {matchup.status === 'score_submitted' && (
                    <Link
                      to={`/matchups/${matchup.id}/confirm`}
                      className="px-3 py-1.5 rounded text-sm font-medium uppercase tracking-wide border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Review & Confirm
                    </Link>
                  )}
                  {matchup.status === 'disputed' && (
                    <p className="text-sm text-red-700">Disputed: {matchup.disputeNote}</p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Score Entry Dialog */}
      {showScoreForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="px-6 pt-6 pb-2 text-lg font-medium text-gray-900">
              Enter Scores - {getTeam(state.matchups.find(m => m.id === showScoreForm)?.homeTeamId || '')?.name} vs {getTeam(state.matchups.find(m => m.id === showScoreForm)?.awayTeamId || '')?.name}
            </h2>

            <div className="px-6 pb-2 space-y-4">
              {gameScores.map((game, idx) => {
                const matchup = state.matchups.find(m => m.id === showScoreForm);
                if (!matchup) return null;
                const homePlayers = getTeamPlayers(matchup.homeTeamId);
                const awayPlayers = getTeamPlayers(matchup.awayTeamId);

                return (
                  <div key={idx} className="border border-gray-200 rounded p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700 uppercase tracking-wide">Game {idx + 1}</span>
                      {gameScores.length > 1 && (
                        <button
                          onClick={() => removeGame(idx)}
                          className="px-2 py-1 rounded text-xs font-medium uppercase tracking-wide text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-600 mb-1 block">Home players</label>
                        <select value={game.homeP1} onChange={e => { const ns = [...gameScores]; ns[idx].homeP1 = e.target.value; setGameScores(ns); }} aria-label={`Game ${idx + 1} home player 1`} className="w-full text-sm px-2 py-1.5 bg-white border border-gray-300 rounded mb-1 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600">
                          {homePlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <select value={game.homeP2} onChange={e => { const ns = [...gameScores]; ns[idx].homeP2 = e.target.value; setGameScores(ns); }} aria-label={`Game ${idx + 1} home player 2`} className="w-full text-sm px-2 py-1.5 bg-white border border-gray-300 rounded outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600">
                          {homePlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-600 mb-1 block">Away players</label>
                        <select value={game.awayP1} onChange={e => { const ns = [...gameScores]; ns[idx].awayP1 = e.target.value; setGameScores(ns); }} aria-label={`Game ${idx + 1} away player 1`} className="w-full text-sm px-2 py-1.5 bg-white border border-gray-300 rounded mb-1 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600">
                          {awayPlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <select value={game.awayP2} onChange={e => { const ns = [...gameScores]; ns[idx].awayP2 = e.target.value; setGameScores(ns); }} aria-label={`Game ${idx + 1} away player 2`} className="w-full text-sm px-2 py-1.5 bg-white border border-gray-300 rounded outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600">
                          {awayPlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <label className="text-xs text-gray-600 mb-1 block" htmlFor={`home-score-${idx}`}>Home score</label>
                        <input
                          id={`home-score-${idx}`}
                          type="number"
                          min="0"
                          max="21"
                          value={game.homeScore}
                          onChange={e => { const ns = [...gameScores]; ns[idx].homeScore = e.target.value; setGameScores(ns); }}
                          className="w-full text-center text-lg font-medium px-2 py-2 bg-white border border-gray-300 rounded outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600 mb-1 block" htmlFor={`away-score-${idx}`}>Away score</label>
                        <input
                          id={`away-score-${idx}`}
                          type="number"
                          min="0"
                          max="21"
                          value={game.awayScore}
                          onChange={e => { const ns = [...gameScores]; ns[idx].awayScore = e.target.value; setGameScores(ns); }}
                          className="w-full text-center text-lg font-medium px-2 py-2 bg-white border border-gray-300 rounded outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              <button
                onClick={addGame}
                className="w-full text-sm py-2 rounded border border-gray-300 text-gray-700 font-medium uppercase tracking-wide hover:bg-gray-100 transition-colors"
              >
                Add Game
              </button>
            </div>

            <div className="flex justify-end gap-2 px-6 py-4">
              <button
                onClick={() => { setShowScoreForm(null); setGameScores([]); }}
                className="px-3 py-2 rounded text-sm font-medium uppercase tracking-wide text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSubmitScores(showScoreForm)}
                className="px-4 py-2 rounded text-sm font-medium uppercase tracking-wide bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm"
              >
                Submit Scores
              </button>
            </div>

            <p className="text-xs text-gray-500 px-6 pb-5">
              After submission, a confirmation link will be generated for the opposing team.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
