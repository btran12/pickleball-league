import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLeague } from '../context/LeagueContext';
import { generateId } from '../utils/helpers';

export default function ConfirmScore() {
  const { matchupId } = useParams<{ matchupId: string }>();
  const navigate = useNavigate();
  const { state, dispatch, getTeam, getPlayer } = useLeague();
  const [disputeNote, setDisputeNote] = useState('');
  const [showDispute, setShowDispute] = useState(false);
  const [actionComplete, setActionComplete] = useState(false);

  const matchup = state.matchups.find(m => m.id === matchupId);
  if (!matchup) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Matchup not found</p>
        <Link to="/matchups" className="text-emerald-600 hover:text-emerald-700 mt-2 inline-block">← Back to Matchups</Link>
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
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Score Reviewed!</h2>
        <p className="text-gray-500 mb-6">
          Thank you for confirming the scores. The results have been recorded.
        </p>
        <Link to="/matchups" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors inline-block">
          Back to Matchups
        </Link>
      </div>
    );
  }

  if (matchup.status === 'confirmed') {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Already Confirmed</h2>
        <p className="text-gray-500 mb-6">These scores have already been confirmed.</p>
        <Link to="/matchups" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors inline-block">
          Back to Matchups
        </Link>
      </div>
    );
  }

  if (matchup.status === 'scheduled') {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <div className="text-6xl mb-4">⏳</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Scores Not Yet Submitted</h2>
        <p className="text-gray-500 mb-6">The scores for this match haven't been entered yet.</p>
        <Link to="/matchups" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors inline-block">
          Back to Matchups
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Review Submitted Scores</h1>
        <p className="text-gray-500 mt-1">Week {matchup.weekNumber} • {homeTeam?.name} vs {awayTeam?.name}</p>
      </div>

      {/* Match Info Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="text-center">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: homeTeam?.color }}>
              {homeTeam?.name.charAt(0)}
            </div>
            <p className="text-sm font-medium mt-1">{homeTeam?.name}</p>
            <p className="text-xs text-gray-500">Home</p>
          </div>
          <span className="text-2xl font-bold text-gray-300">VS</span>
          <div className="text-center">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: awayTeam?.color }}>
              {awayTeam?.name.charAt(0)}
            </div>
            <p className="text-sm font-medium mt-1">{awayTeam?.name}</p>
            <p className="text-xs text-gray-500">Away</p>
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
              <div key={game.id} className="bg-gray-50 rounded-lg p-4">
                <div className="text-xs text-gray-500 mb-2">Game {idx + 1}</div>
                <div className="flex items-center justify-between">
                  <div className={`flex-1 ${homeWon ? '' : 'opacity-60'}`}>
                    <div className="text-sm font-medium">{hp1?.name}</div>
                    <div className="text-sm font-medium">{hp2?.name}</div>
                  </div>
                  <div className="px-4 text-center">
                    <span className={`text-2xl font-bold ${homeWon ? 'text-emerald-600' : 'text-gray-400'}`}>
                      {game.homeScore}
                    </span>
                    <span className="text-gray-300 mx-1 text-lg">-</span>
                    <span className={`text-2xl font-bold ${!homeWon ? 'text-emerald-600' : 'text-gray-400'}`}>
                      {game.awayScore}
                    </span>
                  </div>
                  <div className={`flex-1 text-right ${!homeWon ? '' : 'opacity-60'}`}>
                    <div className="text-sm font-medium">{ap1?.name}</div>
                    <div className="text-sm font-medium">{ap2?.name}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 text-xs text-gray-400 text-center">
          Submitted by {getPlayer(matchup.submittedBy || '')?.name || 'Unknown'} on {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Actions */}
      {!showDispute ? (
        <div className="space-y-3">
          <button
            onClick={handleConfirm}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold text-lg transition-colors shadow-sm"
          >
            ✓ Confirm Scores
          </button>
          <button
            onClick={() => setShowDispute(true)}
            className="w-full bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 py-3 rounded-xl font-semibold transition-colors"
          >
            ⚠️ Dispute Scores
          </button>
        </div>
      ) : (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-red-800">Dispute Scores</h3>
          <p className="text-sm text-red-700">Please describe the issue with the submitted scores. An admin will review and resolve.</p>
          <textarea
            value={disputeNote}
            onChange={e => setDisputeNote(e.target.value)}
            placeholder="Describe the issue..."
            className="w-full px-3 py-2 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
            rows={3}
          />
          <div className="flex gap-3">
            <button
              onClick={handleDispute}
              disabled={!disputeNote.trim()}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white py-2 rounded-lg font-medium transition-colors"
            >
              Submit Dispute
            </button>
            <button
              onClick={() => { setShowDispute(false); setDisputeNote(''); }}
              className="flex-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 py-2 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="text-center">
        <Link to="/matchups" className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to Matchups
        </Link>
      </div>
    </div>
  );
}
