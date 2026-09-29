import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLeague } from '../context/LeagueContext';
import { generateId } from '../utils/helpers';
import { League, Team, Matchup } from '../types';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TEAM_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316', '#14B8A6', '#6366F1', '#84CC16', '#E11D48'];
const TEAM_NAME_SUGGESTIONS = ['Smash Masters', 'Dink Dynasties', 'Kitchen Killers', 'Net Ninjas', 'Paddle Pals', 'Volley Vipers', 'Drop Shot Dodgers', 'Banger Bunch', 'Reset Rulers', 'Speed-Up Squad', 'Third Drop Team', 'Erne Experts'];

export default function NewLeague() {
  const { dispatch } = useLeague();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    seasonName: '',
    startDate: '',
    matchDayOfWeek: 1, // Monday
    matchTime: '18:00',
    totalWeeks: 8,
    numberOfTeams: 6,
    generateSchedule: true,
  });

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.startDate) return;

    // Generate season name if not provided
    const seasonName = formData.seasonName || generateSeasonName(formData.startDate);

    // Create empty league
    const newLeague: League = {
      id: generateId(),
      name: formData.name,
      seasonName,
      startDate: formData.startDate,
      matchDayOfWeek: formData.matchDayOfWeek,
      matchTime: formData.matchTime,
      totalWeeks: formData.totalWeeks,
      isDemo: false,
      createdAt: new Date().toISOString(),
      teams: [],
      players: [],
      matchups: formData.generateSchedule ? generateRoundRobinSchedule(
        formData.numberOfTeams,
        formData.totalWeeks,
        formData.startDate,
        formData.matchDayOfWeek,
        formData.matchTime
      ) : [],
      tokens: [],
      auditLog: [{
        id: generateId(),
        action: 'create_league',
        timestamp: new Date().toISOString(),
        details: `League "${formData.name}" created`,
        userId: 'admin',
      }],
      currentWeek: 1,
    };

    dispatch({ type: 'CREATE_LEAGUE', payload: newLeague });
    navigate('/');
  };

  const generateSeasonName = (startDate: string): string => {
    const date = new Date(startDate);
    const month = date.toLocaleString('en-US', { month: 'long' });
    const year = date.getFullYear();
    const seasons: Record<string, string> = {
      'January': 'Winter', 'February': 'Winter', 'March': 'Spring',
      'April': 'Spring', 'May': 'Spring', 'June': 'Summer',
      'July': 'Summer', 'August': 'Summer', 'September': 'Fall',
      'October': 'Fall', 'November': 'Fall', 'December': 'Winter',
    };
    return `${seasons[month] || 'Season'} ${year}`;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">✨ Create a New League</h1>
        <p className="text-gray-500 mt-2">Set up your pickleball league from scratch</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
              s === step ? 'bg-emerald-600 text-white' : s < step ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'
            }`}>{s}</div>
            {s < 3 && <div className={`w-12 h-0.5 ${s < step ? 'bg-emerald-300' : 'bg-gray-200'}`}></div>}
          </div>
        ))}
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
          <h2 className="text-xl font-semibold text-gray-900">League Details</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">League Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-lg"
              placeholder="e.g., Downtown Pickleball League"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Season Name</label>
            <input
              type="text"
              value={formData.seasonName}
              onChange={e => setFormData({ ...formData, seasonName: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              placeholder={formData.startDate ? generateSeasonName(formData.startDate) : 'Auto-generated from start date'}
            />
            <p className="text-xs text-gray-400 mt-1">Leave blank to auto-generate based on start date</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
            <input
              type="date"
              value={formData.startDate}
              onChange={e => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              required
            />
            <p className="text-xs text-gray-400 mt-1">The date of the first week's matches</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setStep(2)}
              disabled={!formData.name.trim() || !formData.startDate}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Schedule Settings */}
      {step === 2 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
          <h2 className="text-xl font-semibold text-gray-900">Schedule Settings</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Match Day of Week</label>
            <div className="grid grid-cols-7 gap-1">
              {DAYS_OF_WEEK.map((day, idx) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => setFormData({ ...formData, matchDayOfWeek: idx })}
                  className={`py-2 px-1 rounded-lg text-sm font-medium transition-all ${
                    formData.matchDayOfWeek === idx
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Match Time</label>
            <input
              type="time"
              value={formData.matchTime}
              onChange={e => setFormData({ ...formData, matchTime: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Number of Weeks</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="4"
                max="16"
                value={formData.totalWeeks}
                onChange={e => setFormData({ ...formData, totalWeeks: parseInt(e.target.value) })}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <span className="text-lg font-bold text-emerald-600 w-12 text-center">{formData.totalWeeks}</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Season ends: {calculateEndDate(formData.startDate, formData.totalWeeks, formData.matchDayOfWeek)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Number of Teams</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="3"
                max="12"
                value={formData.numberOfTeams}
                onChange={e => setFormData({ ...formData, numberOfTeams: parseInt(e.target.value) })}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <span className="text-lg font-bold text-emerald-600 w-12 text-center">{formData.numberOfTeams}</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {calculateTotalMatches(formData.numberOfTeams, formData.totalWeeks)} total matches across the season
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setStep(1)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-medium transition-colors">← Back</button>
            <button onClick={() => setStep(3)} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-medium transition-colors">Next →</button>
          </div>
        </div>
      )}

      {/* Step 3: Review & Create */}
      {step === 3 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
          <h2 className="text-xl font-semibold text-gray-900">Review & Create</h2>

          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">League Name</span>
              <span className="text-sm font-medium text-gray-900">{formData.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Season</span>
              <span className="text-sm font-medium text-gray-900">{formData.seasonName || generateSeasonName(formData.startDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Start Date</span>
              <span className="text-sm font-medium text-gray-900">{new Date(formData.startDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Match Day</span>
              <span className="text-sm font-medium text-gray-900">{DAYS_OF_WEEK[formData.matchDayOfWeek]}s at {formatTime12(formData.matchTime)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Duration</span>
              <span className="text-sm font-medium text-gray-900">{formData.totalWeeks} weeks</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Teams</span>
              <span className="text-sm font-medium text-gray-900">{formData.numberOfTeams} teams</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Total Matches</span>
              <span className="text-sm font-medium text-gray-900">{calculateTotalMatches(formData.numberOfTeams, formData.totalWeeks)}</span>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <h3 className="font-medium text-emerald-800 mb-2">📋 What happens next?</h3>
            <ul className="text-sm text-emerald-700 space-y-1">
              <li>• An empty league will be created with your settings</li>
              <li>• {formData.generateSchedule ? 'A round-robin schedule will be auto-generated' : 'You can create matchups manually'}</li>
              <li>• Add teams and players from the Teams/Players pages</li>
              <li>• Assign players to teams and start playing!</li>
            </ul>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="generateSchedule"
              checked={formData.generateSchedule}
              onChange={e => setFormData({ ...formData, generateSchedule: e.target.checked })}
              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
            />
            <label htmlFor="generateSchedule" className="text-sm text-gray-700">
              Auto-generate round-robin schedule (can be edited later)
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setStep(2)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-medium transition-colors">← Back</button>
            <button onClick={handleSubmit} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-bold transition-colors text-lg">
              🏆 Create League
            </button>
          </div>
        </div>
      )}

      {/* Demo League Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
        <h3 className="font-semibold text-blue-800 mb-2">💡 Demo League Available</h3>
        <p className="text-sm text-blue-700">
          A pre-populated demo league with sample teams, players, and match history is available for testing.
          You can switch between leagues using the league selector in the header.
        </p>
      </div>
    </div>
  );
}

// Helper: Generate round-robin schedule
function generateRoundRobinSchedule(numTeams: number, totalWeeks: number, startDate: string, dayOfWeek: number, time: string): Matchup[] {
  const matchups: Matchup[] = [];
  
  // Create team IDs (placeholder - user will assign real teams later)
  const teamIds = Array.from({ length: numTeams }, (_, i) => `new_team_${i + 1}`);
  
  // If odd number of teams, add a "bye" team
  if (numTeams % 2 !== 0) {
    teamIds.push('BYE');
  }
  
  const n = teamIds.length;
  
  // Round-robin algorithm (circle method)
  for (let week = 0; week < Math.min(totalWeeks, n - 1); week++) {
    for (let match = 0; match < n / 2; match++) {
      const home = teamIds[match];
      const away = teamIds[n - 1 - match];
      
      // Skip bye matches
      if (home === 'BYE' || away === 'BYE') continue;
      
      const matchDate = getMatchDate(startDate, week, dayOfWeek);
      
      matchups.push({
        id: generateId(),
        weekNumber: week + 1,
        homeTeamId: home,
        awayTeamId: away,
        status: 'scheduled',
        courtLocation: `Court ${(match % 3) + 1}`,
        scheduledTime: `${matchDate}T${time}`,
        submittedBy: null,
        confirmedBy: null,
        disputeNote: null,
        games: [],
      });
    }
    
    // Rotate teams (keep first team fixed, rotate the rest)
    const last = teamIds.pop()!;
    teamIds.splice(1, 0, last);
  }
  
  return matchups;
}

function getMatchDate(startDate: string, weekOffset: number, dayOfWeek: number): string {
  const start = new Date(startDate);
  // Find the first occurrence of the target day of week
  const startDay = start.getDay();
  let daysUntilTarget = dayOfWeek - startDay;
  if (daysUntilTarget < 0) daysUntilTarget += 7;
  
  const firstMatchDate = new Date(start);
  firstMatchDate.setDate(firstMatchDate.getDate() + daysUntilTarget);
  
  // Add weeks
  const matchDate = new Date(firstMatchDate);
  matchDate.setDate(matchDate.getDate() + weekOffset * 7);
  
  return matchDate.toISOString().split('T')[0];
}

function calculateEndDate(startDate: string, weeks: number, dayOfWeek: number): string {
  const endDate = new Date(getMatchDate(startDate, weeks - 1, dayOfWeek));
  return endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function calculateTotalMatches(numTeams: number, weeks: number): number {
  const matchesPerWeek = Math.floor(numTeams / 2);
  return matchesPerWeek * weeks;
}

function formatTime12(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const h = hours % 12 || 12;
  return `${h}:${minutes.toString().padStart(2, '0')} ${period}`;
}
