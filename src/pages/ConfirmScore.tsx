import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLeague } from '../context/LeagueContext';
import { generateId } from '../utils/helpers';

export default function ConfirmScore() {
  const { matchupId } = useParams<{ matchupId: string }>();
  const { state, dispatch, getTeam, getPlayer } = useLeague();
  const [disputeNote, setDisputeNote] = useState('');
  const [showDispute, setShowDispute] = useState(false);
  const [actionComplete, setActionComplete] = useState(false);

  const matchup = state.matchups.find(m => m.id === matchupId);
  if (!matchup) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 text-lg">Matchup not found</p>
        <Link
          to="/matchups"
          className="mt-2 inline-block px-3 py-2 rounded text-sm font-medium uppercase tracking-wide text-emerald-700 hover:bg-emerald-50 transition-colors"
        >
          Back to Matchups
        </Link>
      </div>
    );
  }

  const homeTeam = getTeam(matchup.homeTeamId);
  const awayTeam = getTeam(matchup.awayTeamId);

  const handleConfirm = () => {
    dispatch({ type: 'CONFIRM_SCORES', payload: { matchupId: matchup.id, confirmedBy: 'opposing_team' } });
    dispatch({
      type: 'ADD_AUDIT',
      payload: {
        id: generateId(),
        action: 'confirm_scores',
        timestamp: new Date().toISOString(),
        details: `Scores confirmed for ${homeTeam?.name} vs ${awayTeam?.name} (Week ${matchup.weekNumber})`,
        userId: 'opposing_team',
      }
    });
    setActionComplete(true);
  };

  const handleDispute = () => {
    if (!disputeNote.trim()) return;
    dispatch({ type: 'DISPUTE_SCORES', payload: { matchupId: matchup.id, note: disputeNote } });
    dispatch({
      type: 'ADD_AUDIT',
      payload: {
        id: generateId(),
        action: 'dispute_scores',
        timestamp: new Date().toISOString(),
        details: `Scores disputed for ${homeTeam?.name} vs ${awayTeam?.name}: "${disputeNote}"`,
        userId: 'opposing_team',
      }
    });
    setActionComplete(true);
  };

  if (actionComplete) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <h2 className="text-2xl font-medium text-gray-900 mb-2">Score Reviewed</h2>
        <p className="text-gray-600 mb-6">
          Thank you for confirming the scores. The results have been recorded.
        </p>
        <Link
          to="/matchups"
          className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded text-sm font-medium uppercase tracking-wide transition-colors shadow-sm"
        >
          Back to Matchups
        </Link>
      </div>
    );
  }

  if (matchup.status === 'confirmed') {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <h2 className="text-2xl font-medium text-gray-900 mb-2">Already Confirmed</h2>
        <p className="text-gray-600 mb-6">These scores have already been confirmed.</p>
        <Link
          to="/matchups"
          className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded text-sm font-medium uppercase tracking-wide transition-colors shadow-sm"
        >
          Back to Matchups
        </Link>
      </div>
    );
  }

  if (matchup.status === 'scheduled') {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <h2 className="text-2xl font-medium text-gray-900 mb-2">Scores Not Yet Submitted</h2>
        <p className="text-gray-600 mb-6">The scores for this match haven't been entered yet.</p>
        <Link
          to="/matchups"
          className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded text-sm font-medium uppercase tracking-wide transition-colors shadow-sm"
        >
          Back to Matchups
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-medium text-gray-900">Review Submitted Scores</h1>
        <p className="text-gray-600 mt-1 text-sm">Week {matchup.weekNumber} • {homeTeam?.name} vs {awayTeam?.name}</p>
      </div>

      {/* Match Info Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <div className="flex items-center justify-center gap-6 mb-4">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-900">{homeTeam?.name}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wide mt-0.5">Home</p>
          </div>
          <span className="text-sm text-gray-400 uppercase tracking-wide">vs</span>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-900">{awayTeam?.name}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wide mt-0.5">Away</p>
          </div>
        </div>

        <div className="space-y-3">
          {matchup.games.map((game, idx) => {
            const hp1 = getPlayer(game.homePlayer1Id);
            const hp2 = getPlayer(game.homePlayer2Id);
            const ap1 = getPlayer(game.awayPlayer1Id);
            const ap2 = getPlayer(game.awayPlayer2Id);
            const homeWon = (game.homeScore || 0) > (game.awayScore || 0);

            return (
              <div key={game.id} className="bg-gray-50 rounded p-4">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Game {idx + 1}</div>
                <div className="flex items-center justify-between">
                  <div className={`flex-1 ${homeWon ? '' : 'opacity-60'}`}>
                    <div className="text-sm font-medium text-gray-900">{hp1?.name}</div>
                    <div className="text-sm font-medium text-gray-900">{hp2?.name}</div>
                  </div>
                  <div className="px-4 text-center tabular-nums">
                    <span className={`text-2xl font-medium ${homeWon ? 'text-emerald-700' : 'text-gray-500'}`}>
                      {game.homeScore}
                    </span>
                    <span className="text-gray-300 mx-1 text-lg">&ndash;</span>
                    <span className={`text-2xl font-medium ${!homeWon ? 'text-emerald-700' : 'text-gray-500'}`}>
                      {game.awayScore}
                    </span>
                  </div>
                  <div className={`flex-1 text-right ${!homeWon ? '' : 'opacity-60'}`}>
                    <div className="text-sm font-medium text-gray-900">{ap1?.name}</div>
                    <div className="text-sm font-medium text-gray-900">{ap2?.name}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 text-xs text-gray-500 text-center">
          Submitted by {getPlayer(matchup.submittedBy || '')?.name || 'Unknown'} on {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Actions */}
      {!showDispute ? (
        <div className="space-y-3">
          <button
            onClick={handleConfirm}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded text-sm font-medium uppercase tracking-wide transition-colors shadow-sm"
          >
            Confirm Scores
          </button>
          <button
            onClick={() => setShowDispute(true)}
            className="w-full py-3 rounded text-sm font-medium uppercase tracking-wide border border-red-300 text-red-700 hover:bg-red-50 transition-colors"
          >
            Dispute Scores
          </button>
        </div>
      ) : (
        <div className="bg-red-50 border border-red-200 rounded-lg p-5 space-y-4">
          <h3 className="text-base font-medium text-red-900">Dispute Scores</h3>
          <p className="text-sm text-red-700">Please describe the issue with the submitted scores. An admin will review and resolve.</p>
          <textarea
            value={disputeNote}
            onChange={e => setDisputeNote(e.target.value)}
            placeholder="Describe the issue..."
            aria-label="Dispute note"
            className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded outline-none resize-none transition-shadow focus:border-red-600 focus:ring-1 focus:ring-red-600"
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => { setShowDispute(false); setDisputeNote(''); }}
              className="px-3 py-2 rounded text-sm font-medium uppercase tracking-wide text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDispute}
              disabled={!disputeNote.trim()}
              className="px-4 py-2 rounded text-sm font-medium uppercase tracking-wide bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300 transition-colors"
            >
              Submit Dispute
            </button>
          </div>
        </div>
      )}

      <div className="text-center">
        <Link
          to="/matchups"
          className="inline-block px-3 py-2 rounded text-sm font-medium uppercase tracking-wide text-gray-600 hover:bg-gray-100 transition-colors"
        >
          Back to Matchups
        </Link>
      </div>
    </div>
  );
}
