import React, { useContext, useState } from 'react';
import { AppProvider, AppContext } from './context/AppContext';
import Sidebar from './components/Sidebar';
import MusicPlayer from './components/MusicPlayer';
import AuthModal from './components/AuthModal';
import { User, Settings, Crown } from 'lucide-react';

// Views
import HomeView from './views/HomeView';
import SearchView from './views/SearchView';
import LibraryView from './views/LibraryView';
import UploadView from './views/UploadView';
import BillingView from './views/BillingView';
import SettingsView from './views/SettingsView';
import ProfileView from './views/ProfileView';
import PlaylistDetailsView from './views/PlaylistDetailsView';
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
    setActiveView 
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
      case 'billing':
        return <BillingView />;
      case 'settings':
        return <SettingsView />;
      case 'profile':
        return <ProfileView />;
      case 'playlist-details':
        return <PlaylistDetailsView />;
      default:
        return <HomeView />;
    }
  };

  return (
    <div className="app-container">
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
                style={{ cursor: 'pointer', position: 'relative' }}
              >
                {user.name.charAt(0).toUpperCase()}
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
                {!user.isPremium && (
                  <button 
                    className="btn btn-primary"
                    style={{ padding: '6px 12px', fontSize: '12px', background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', border: 'none', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: 'none' }}
                    onClick={() => setActiveView('billing')}
                  >
                    <Crown className="w-3.5 h-3.5 text-white" />
                    <span style={{ color: 'white' }}>Go Premium</span>
                  </button>
                )}
                <button 
                  className="btn-icon" 
                  style={{ width: '32px', height: '32px', border: 'none', background: 'var(--bg-tertiary)' }}
                  onClick={() => setActiveView('settings')}
                  title="Profile Settings"
                >
                  <Settings className="w-4 h-4" />
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
