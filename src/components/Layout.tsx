import { Link, useLocation } from 'react-router-dom';
import { useLeague } from '../context/LeagueContext';
import { useState } from 'react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { state, league, dispatch } = useLeague();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLeagueSwitcher, setShowLeagueSwitcher] = useState(false);

  const navItems = [
    { path: '/', label: 'Dashboard', icon: '🏠' },
    { path: '/teams', label: 'Teams', icon: '👥' },
    { path: '/players', label: 'Players', icon: '🏓' },
    { path: '/matchups', label: 'Matchups', icon: '⚔️' },
    { path: '/rankings', label: 'Rankings', icon: '🏆' },
    { path: '/new-league', label: 'New League', icon: '✨' },
    { path: '/admin', label: 'Admin', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-emerald-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-3xl">🏆</span>
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Zero 2 League
              </span>
            </Link>

            {/* League Switcher */}
            <div className="hidden md:flex items-center gap-2 relative">
              <button
                onClick={() => setShowLeagueSwitcher(!showLeagueSwitcher)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors text-sm"
              >
                {league.isDemo && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">DEMO</span>}
                <span className="font-medium text-gray-800">{league.name}</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showLeagueSwitcher && (
                <div className="absolute top-full mt-1 right-0 bg-white rounded-xl shadow-lg border border-gray-200 py-2 min-w-64 z-50">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase">Switch League</div>
                  {state.leagues.map(l => (
                    <button
                      key={l.id}
                      onClick={() => { dispatch({ type: 'SET_CURRENT_LEAGUE', payload: l.id }); setShowLeagueSwitcher(false); }}
                      className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-gray-50 transition-colors ${
                        l.id === league.id ? 'bg-emerald-50' : ''
                      }`}
                    >
                      <span className="flex-1">
                        <span className="font-medium text-sm text-gray-900">{l.name}</span>
                        {l.isDemo && <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">DEMO</span>}
                      </span>
                      {l.id === league.id && <span className="text-emerald-600 text-xs">✓</span>}
                    </button>
                  ))}
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <Link
                      to="/new-league"
                      onClick={() => setShowLeagueSwitcher(false)}
                      className="block px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50 font-medium"
                    >
                      + Create New League
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden lg:inline text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                {league.seasonName}
              </span>
              <button
                onClick={() => {
                  dispatch({ type: 'SET_ADMIN', payload: !state.isAdmin });
                }}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
                  state.isAdmin
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                {state.isAdmin ? '🔓 Admin' : '🔒 Admin'}
              </button>
              <button
                className="md:hidden p-2 rounded-lg hover:bg-gray-100"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white/95 backdrop-blur-md">
            {/* Mobile league switcher */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="text-xs text-gray-400 mb-1">Current League</div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">{league.name}</span>
                {league.isDemo && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">DEMO</span>}
              </div>
              <select
                value={league.id}
                onChange={e => dispatch({ type: 'SET_CURRENT_LEAGUE', payload: e.target.value })}
                className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                {state.leagues.map(l => (
                  <option key={l.id} value={l.id}>{l.name}{l.isDemo ? ' (Demo)' : ''}</option>
                ))}
              </select>
            </div>
            <nav className="px-4 py-3 space-y-1">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    location.pathname === item.path
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Desktop Nav Bar */}
      <nav className="hidden md:block bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                  location.pathname === item.path
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-1">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
