import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, Outlet, Link, useLocation } from 'react-router-dom';
import { Users, LayoutDashboard, Calculator, Wallet, Repeat, Trophy, LogOut, Search, Menu, X, UserPlus, History as HistoryIcon } from 'lucide-react';

// Pages (will be extracted later)
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Investors from './pages/Investors';
import PnL from './pages/PnL';
import Funds from './pages/Funds';
import Returns from './pages/Returns';
import Referrals from './pages/Referrals';
import FreeShares from './pages/FreeShares';
import Profile from './pages/Profile';
import InvestorProfile from './pages/InvestorProfile';
import Team from './pages/Team';
import History from './pages/History';
import { getInvestors } from './db';

import './App.css'; // local overrides if any

const Sidebar = ({ isOpen, setOpen, user }) => {
  const location = useLocation();
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Investors', path: '/investors', icon: Users },
    { name: 'Company PnL', path: '/pnl', icon: Calculator },
    { name: 'Funds Details', path: '/funds', icon: Wallet },
    { name: 'Return Investment', path: '/returns', icon: Repeat },
    { name: 'Referral Ranking', path: '/referrals', icon: Trophy },
    { name: 'History', path: '/history', icon: HistoryIcon },
  ];

  if (user?.role === 'Founder') {
    navItems.push({ name: 'Team Management', path: '/team', icon: UserPlus });
  }

  // Close sidebar on mobile when navigating, but keep it open on desktop
  const handleNavClick = () => {
    if (window.innerWidth <= 768) {
      setOpen(false);
    }
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }} onClick={handleNavClick}>
          <h2>WOORA</h2>
        </Link>
        <button type="button" className="close-btn md-hidden" onClick={() => setOpen(false)}>
          <X size={24} />
        </button>
      </div>
      <nav className="sidebar-nav">
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <Link 
              key={item.path} 
              to={item.path} 
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={handleNavClick}
            >
              <Icon size={20} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        <button className="nav-item text-red" onClick={() => {
          localStorage.removeItem('woora_logged_in');
          localStorage.removeItem('woora_user');
          localStorage.removeItem('woora_last_active');
          window.location.reload();
        }}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const userStr = localStorage.getItem('woora_user');
  const user = userStr ? JSON.parse(userStr) : null;

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const query = searchQuery.trim().toLowerCase();
    const investors = await getInvestors();
    
    let found = investors.find(i => i.id.toString().toLowerCase() === query);
    
    if (!found) {
      found = investors.find(i => i.mobile.includes(query));
    }
    
    if (!found) {
      found = investors.find(i => i.name.toLowerCase().includes(query));
    }

    if (found) {
      navigate(`/investor/${found.id}`);
      setSearchQuery('');
    } else {
      alert("No investor found matching your search.");
    }
  };

  return (
    <div className="app-container">
      <Sidebar isOpen={sidebarOpen} setOpen={setSidebarOpen} user={user} />
      
      <main className={`main-content ${!sidebarOpen ? 'expanded' : ''}`}>
        <header className="topbar no-print">
          <button type="button" className="menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu size={24} />
          </button>
          
          <div className="search-bar">
            <Search size={20} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search ID, Name, Mobile..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
              className="input-field"
            />
          </div>
          
          <div className="user-profile" onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>
            <div className="avatar">{user ? user.name.charAt(0).toUpperCase() : 'U'}</div>
            <span className="md-hidden-down">{user ? user.name : 'User'}</span>
          </div>
        </header>
        
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

const ProtectedRoute = ({ children }) => {
  const isAuth = localStorage.getItem('woora_logged_in') === 'true';
  return isAuth ? children : <Navigate to="/login" />;
};

const SessionTimeoutHandler = ({ children }) => {
  return children;
};


const RoleRoute = ({ children, allowedRoles }) => {
  const userStr = localStorage.getItem('woora_user');
  const user = userStr ? JSON.parse(userStr) : null;
  
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/" />;
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<ProtectedRoute><SessionTimeoutHandler><Layout /></SessionTimeoutHandler></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="investors" element={<Investors />} />
          <Route path="pnl" element={<PnL />} />
          <Route path="funds" element={<Funds />} />
          <Route path="returns" element={<Returns />} />
          <Route path="referrals" element={<Referrals />} />
          <Route path="free-shares" element={<FreeShares />} />
          <Route path="profile" element={<Profile />} />
          <Route path="investor/:id" element={<InvestorProfile />} />
          <Route path="history" element={<History />} />
          <Route path="team" element={<RoleRoute allowedRoles={['Founder']}><Team /></RoleRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
