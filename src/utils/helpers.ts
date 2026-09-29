export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function generateToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'scheduled': return 'bg-gray-100 text-gray-700';
    case 'score_submitted': return 'bg-yellow-100 text-yellow-700';
    case 'confirmed': return 'bg-green-100 text-green-700';
    case 'disputed': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case 'scheduled': return 'Scheduled';
    case 'score_submitted': return 'Pending Confirmation';
    case 'confirmed': return 'Confirmed';
    case 'disputed': return 'Disputed';
    default: return status;
  }
}

export function calculateTeamStandings(teams: any[], matchups: any[]) {
  const confirmed = matchups.filter(m => m.status === 'confirmed');
  return teams.map(team => {
    const teamMatchups = confirmed.filter(m => m.homeTeamId === team.id || m.awayTeamId === team.id);
    let wins = 0, losses = 0, pointsFor = 0, pointsAgainst = 0;
    
    teamMatchups.forEach(m => {
      let teamScore = 0, oppScore = 0;
      m.games.forEach((g: any) => {
        if (m.homeTeamId === team.id) {
          teamScore += g.homeScore || 0;
          oppScore += g.awayScore || 0;
        } else {
          teamScore += g.awayScore || 0;
          oppScore += g.homeScore || 0;
        }
      });
      pointsFor += teamScore;
      pointsAgainst += oppScore;
      if (teamScore > oppScore) wins++;
      else losses++;
    });

    return { ...team, wins, losses, pointsFor, pointsAgainst, pointDiff: pointsFor - pointsAgainst };
  }).sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    return b.pointDiff - a.pointDiff;
  });
}
