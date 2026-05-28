import React, { useContext, useState } from 'react';
import { AppProvider, AppContext } from './context/AppContext';
import Sidebar from './components/Sidebar';
import RightSidebar from './components/RightSidebar';
import MusicPlayer from './components/MusicPlayer';
import AuthModal from './components/AuthModal';
import { User, Settings, Crown, LogOut } from 'lucide-react';

// Views
import HomeView from './views/HomeView';
import SearchView from './views/SearchView';
import LibraryView from './views/LibraryView';
import UploadView from './views/UploadView';
import BillingView from './views/BillingView';
import SettingsView from './views/SettingsView';
import ProfileView from './views/ProfileView';
import PlaylistDetailsView from './views/PlaylistDetailsView';
import ChartDetailsView from './views/ChartDetailsView';
import LyricsView from './views/LyricsView';
import EventsView from './views/EventsView';

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
  
  // Auth modal management state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState('login');

  const openAuthModal = (mode = 'login') => {
    setAuthInitialMode(mode);
    setIsAuthOpen(true);
  };

  // Render matched view inside dynamic wrapper
  const renderView = () => {
    if (showLyrics && currentTrack) {
      return <LyricsView />;
    }
    
    switch (activeView) {
      case 'home':
        return <HomeView />;
      case 'search':
        return <SearchView />;
      case 'events':
        return <EventsView />;
      case 'library':
        return <LibraryView />;
      case 'upload':
        return <UploadView />;
      case 'settings':
        return <SettingsView />;
      case 'profile':
        return <ProfileView />;
      case 'playlist-details':
        return <PlaylistDetailsView />;
      case 'chart-details':
        return <ChartDetailsView />;
      case 'song-details':
        return <SongDetailsView />;
      default:
        return <HomeView />;
    }
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
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}

export default App;
