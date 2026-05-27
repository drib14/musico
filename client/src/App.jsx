import React, { useContext, useState } from 'react';
import { AppProvider, AppContext } from './context/AppContext';
import Sidebar from './components/Sidebar';
import MusicPlayer from './components/MusicPlayer';
import AuthModal from './components/AuthModal';

// Views
import HomeView from './views/HomeView';
import SearchView from './views/SearchView';
import LibraryView from './views/LibraryView';
import UploadView from './views/UploadView';
import BillingView from './views/BillingView';
import SettingsView from './views/SettingsView';
import ProfileView from './views/ProfileView';

const MainAppContent = () => {
  const { activeView, toast } = useContext(AppContext);
  
  // Auth modal management state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState('login');

  const openAuthModal = (mode = 'login') => {
    setAuthInitialMode(mode);
    setIsAuthOpen(true);
  };

  // Render matched view inside dynamic wrapper
  const renderView = () => {
    switch (activeView) {
      case 'home':
        return <HomeView />;
      case 'search':
        return <SearchView />;
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
