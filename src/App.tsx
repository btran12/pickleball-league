import { HashRouter, Routes, Route } from 'react-router-dom';
import { LeagueProvider } from './context/LeagueContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Teams from './pages/Teams';
import Players from './pages/Players';
import Matchups from './pages/Matchups';
import Rankings from './pages/Rankings';
import Admin from './pages/Admin';
import ConfirmScore from './pages/ConfirmScore';
import NewLeague from './pages/NewLeague';

function App() {
  return (
    <LeagueProvider>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/players" element={<Players />} />
            <Route path="/matchups" element={<Matchups />} />
            <Route path="/matchups/:matchupId/confirm" element={<ConfirmScore />} />
            <Route path="/rankings" element={<Rankings />} />
            <Route path="/new-league" element={<NewLeague />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </Layout>
      </HashRouter>
    </LeagueProvider>
  );
}

export default App;
