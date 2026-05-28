import React, { useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AppProvider, AppContext } from './context/AppContext';
import Sidebar from './components/Sidebar';
import RightSidebar from './components/RightSidebar';
import MusicPlayer from './components/MusicPlayer';
import AuthModal from './components/AuthModal';
import { User, Settings, Crown, LogOut, Home as HomeIcon, Search as SearchIcon, Library as LibraryIcon, UploadCloud as UploadIcon } from 'lucide-react';

// Pages
import Home from './pages/Home';
import Search from './pages/Search';
import Library from './pages/Library';
import Upload from './pages/Upload';
import Billing from './pages/Billing';
import SettingsView from './pages/Settings';
import Profile from './pages/Profile';
import PlaylistDetails from './pages/PlaylistDetails';
import ChartDetails from './pages/ChartDetails';
import Lyrics from './pages/Lyrics';
import SongDetails from './pages/SongDetails';

const MainAppContent = () => {
  const { 
    activeView, 
    toast, 
    showLyrics, 
    setShowLyrics, 
    currentTrack, 
    user, 
    setActiveView,
    logoutUser
  } = useContext(AppContext);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Auth modal management state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState('login');

  const openAuthModal = (mode = 'login') => {
    setAuthInitialMode(mode);
    setIsAuthOpen(true);
  };

  // Sync activeView context state with browser URL path changes (two-way binding)
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/pages/')) {
      const viewId = path.substring(7); // Extract the view name (e.g. 'home')
      if (activeView !== viewId) {
        setActiveView(viewId);
      }
    } else if (path === '/') {
      setActiveView('home');
    }
  }, [location.pathname]);

  // Sync browser URL path with activeView context state changes (two-way binding)
  useEffect(() => {
    const expectedPath = `/pages/${activeView}`;
    if (location.pathname !== expectedPath && location.pathname !== '/' && !location.pathname.startsWith('/pages/lyrics')) {
      navigate(expectedPath);
    }
  }, [activeView, navigate, location.pathname]);

  // Render matched view inside dynamic wrapper
  const renderView = () => {
    if (showLyrics && currentTrack) {
      return <Lyrics />;
    }
    
    return (
      <Routes>
        <Route path="/" element={<Navigate to="/pages/home" replace />} />
        <Route path="/pages/home" element={<Home />} />
        <Route path="/pages/search" element={<Search />} />
        <Route path="/pages/library" element={<Library />} />
        <Route path="/pages/upload" element={<Upload />} />
        <Route path="/pages/settings" element={<SettingsView />} />
        <Route path="/pages/profile" element={<Profile />} />
        <Route path="/pages/playlist-details" element={<PlaylistDetails />} />
        <Route path="/pages/chart-details" element={<ChartDetails />} />
        <Route path="/pages/song-details" element={<SongDetails />} />
        <Route path="*" element={<Navigate to="/pages/home" replace />} />
      </Routes>
    );
  };

  return (
    <div className={`app-container ${currentTrack && currentTrack._id ? 'has-right-panel has-player' : ''}`}>
      {/* Sidebar navigation */}
      <Sidebar onOpenAuth={openAuthModal} />

      {/* Main scrollable layout */}
      <main className="main-content">
        {/* Mobile Header: Spotify-styled responsive layout */}
        <div className="mobile-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {user ? (
              <div 
                className="mobile-avatar-circle" 
                onClick={() => setActiveView('settings')}
                style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
              >
                {user.userAvatar ? (
                  <img 
                    src={user.userAvatar} 
                    alt={user.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
                {user.isPremium && (
                  <div className="mobile-avatar-crown-indicator">
                    <Crown className="w-2.5 h-2.5" />
                  </div>
                )}
              </div>
            ) : (
              <div 
                className="mobile-avatar-circle anonymous" 
                onClick={() => openAuthModal('login')}
                style={{ cursor: 'pointer' }}
              >
                <User className="w-4 h-4" />
              </div>
            )}
            <span className="mobile-header-brand" onClick={() => setActiveView('home')} style={{ cursor: 'pointer' }}>
              Musico
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {user ? (
              <>
                <button 
                  className="btn-icon" 
                  style={{ width: '32px', height: '32px', border: 'none', background: 'var(--bg-tertiary)' }}
                  onClick={() => setActiveView('settings')}
                  title="Profile Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button 
                  className="btn-icon" 
                  style={{ width: '32px', height: '32px', border: 'none', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}
                  onClick={() => {
                    logoutUser();
                  }}
                  title="Log Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button 
                className="btn btn-primary" 
                style={{ padding: '6px 14px', fontSize: '12px', borderRadius: '20px' }}
                onClick={() => openAuthModal('login')}
              >
                Sign In
              </button>
            )}
          </div>
        </div>

        {renderView()}
      </main>

      {/* Right side panel */}
      {currentTrack && currentTrack._id && <RightSidebar />}

      {/* Bottom persistent playback controller */}
      <MusicPlayer />

      {/* Mobile Bottom Navigation Bar */}
      <div className="mobile-bottom-nav">
        {[
          { id: 'home', label: 'Home', icon: HomeIcon },
          { id: 'search', label: 'Search', icon: SearchIcon },
          { id: 'library', label: 'Library', icon: LibraryIcon },
          { id: 'upload', label: 'Upload', icon: UploadIcon }
        ].map((item) => {
          const Icon = item.icon;
          const isSelected = activeView === item.id;
          return (
            <div
              key={item.id}
              className={`mobile-bottom-nav-item ${isSelected ? 'active' : ''}`}
              onClick={() => {
                if ((item.id === 'upload' || item.id === 'library') && !user) {
                  openAuthModal('login');
                  return;
                }
                setShowLyrics(false);
                setActiveView(item.id);
                navigate(`/pages/${item.id}`);
              }}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </div>
          );
        })}
      </div>

      {/* Login / Register Modal Portal overlay */}
      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
        initialMode={authInitialMode} 
      />

      {/* Float Notification Toast Overlay */}
      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}>
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Top-level provider wrapper
function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <MainAppContent />
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;
