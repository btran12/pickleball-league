import { Link, useLocation } from 'react-router-dom';
import { useLeague } from '../context/LeagueContext';
import { useState } from 'react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { state, dispatch } = useLeague();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/teams', label: 'Teams' },
    { path: '/players', label: 'Players' },
    { path: '/matchups', label: 'Matchups' },
    { path: '/rankings', label: 'Rankings' },
    { path: '/admin', label: 'Admin' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="text-xl font-medium text-gray-900">
              PicklePal
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                    location.pathname === item.path
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-medium">
                {state.seasonName}
              </span>
              <button
                onClick={() => dispatch({ type: 'SET_ADMIN', payload: !state.isAdmin })}
                aria-pressed={state.isAdmin}
                className={`text-xs px-3 py-1.5 rounded font-medium uppercase tracking-wide transition-colors ${
                  state.isAdmin
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {state.isAdmin ? 'Admin On' : 'Admin Off'}
              </button>
              <button
                className="md:hidden px-3 py-1.5 rounded text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? 'Close' : 'Menu'}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <nav className="px-4 py-3 space-y-1">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded text-sm font-medium transition-colors ${
                    location.pathname === item.path
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
