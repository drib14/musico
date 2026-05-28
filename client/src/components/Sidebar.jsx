import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { 
  Home, 
  Search, 
  Library, 
  UploadCloud, 
  Crown, 
  LogOut, 
  LogIn,
  Sun,
  Moon,
  Laptop,
  Settings,
  Ticket
} from 'lucide-react';

const Sidebar = ({ onOpenAuth }) => {
  const { 
    user, 
    logoutUser, 
    activeView, 
    setActiveView, 
    theme, 
    setTheme,
    setShowLyrics
  } = useContext(AppContext);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const navigate = useNavigate();

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'library', label: 'Your Library', icon: Library },
    { id: 'upload', label: 'Upload Track', icon: UploadCloud },
    ...(user ? [{ id: 'settings', label: 'Settings', icon: Settings }] : []),
  ];

  const handleNavClick = (viewId) => {
    if ((viewId === 'upload' || viewId === 'library') && !user) {
      onOpenAuth('login');
      return;
    }
    setShowLyrics(false);
    setActiveView(viewId);
    navigate(`/pages/${viewId}`);
  };

  const getThemeIcon = () => {
    switch(theme) {
      case 'light': return <Sun className="w-4 h-4" />;
      case 'dark': return <Moon className="w-4 h-4" />;
      default: return <Laptop className="w-4 h-4" />;
    }
  };

  return (
    <aside className="sidebar">
      <div>
        {/* Brand Logo */}
        <div className="logo-container">
          <svg className="logo-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18V5l12-2v13"></path>
            <circle cx="6" cy="18" r="3"></circle>
            <circle cx="18" cy="16" r="3"></circle>
          </svg>
          <span className="logo-text">Musico</span>
        </div>

        {/* Navigation list */}
        <nav className="nav-group">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isSelected = activeView === item.id;
            
            // Render custom styling for upgrade option
            if (item.id === 'billing' && user?.isPremium) return null;

            const isMobileHide = item.id === 'settings' || item.id === 'billing';

            return (
              <div
                key={item.id}
                className={`nav-item ${isSelected ? 'active' : ''} ${item.highlight ? 'upgrade-item' : ''} ${isMobileHide ? 'mobile-hide' : ''}`}
                onClick={() => handleNavClick(item.id)}
              >
                <Icon />
                <span>{item.label}</span>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Footer Settings & Auth Profiles */}
      <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Theme Settings Selector */}
        <div style={{ position: 'relative' }}>
          <button 
            className="btn btn-secondary w-full"
            style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', width: '100%' }}
            onClick={() => setShowThemeMenu(!showThemeMenu)}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              {getThemeIcon()}
              Theme
            </span>
            <span style={{ fontSize: '11px', textTransform: 'capitalize', color: 'var(--text-secondary)' }}>
              {theme}
            </span>
          </button>
          
          {showThemeMenu && (
            <div 
              style={{
                position: 'absolute',
                bottom: '45px',
                left: '0',
                right: '0',
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '4px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                zIndex: '50'
              }}
            >
              {[
                { id: 'dark', label: 'Dark', icon: Moon },
                { id: 'light', label: 'Light', icon: Sun },
                { id: 'system', label: 'System', icon: Laptop }
              ].map(opt => (
                <button
                  key={opt.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '8px',
                    border: 'none',
                    background: theme === opt.id ? 'var(--accent-light)' : 'none',
                    color: theme === opt.id ? 'var(--accent)' : 'var(--text-primary)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    textAlign: 'left'
                  }}
                  onClick={() => {
                    setTheme(opt.id);
                    setShowThemeMenu(false);
                  }}
                >
                  <opt.icon className="w-4 h-4" />
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User Card */}
        {user ? (
          <div 
            className="user-sidebar-card"
            onClick={() => triggerProfileView(user._id, false)}
            style={{ cursor: 'pointer' }}
          >
            {user.userAvatar ? (
              <img 
                src={user.userAvatar} 
                alt={user.name} 
                style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }} 
              />
            ) : (
              <div className="avatar-initial">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="user-info" style={{ flex: 1, minWidth: 0 }}>
              <div className="user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
              {user.isPremium ? (
                <div className="user-badge">
                  <Crown style={{ width: '10px', height: '10px' }} />
                  Premium
                </div>
              ) : (
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Free Account</div>
              )}
            </div>
            <button 
              className="btn-icon" 
              style={{ border: 'none', background: 'transparent' }}
              onClick={(e) => { e.stopPropagation(); logoutUser(); }}
              title="Logout"
            >
              <LogOut className="w-4 h-4" style={{ color: 'var(--danger)' }} />
            </button>
          </div>
        ) : (
          <button 
            className="btn btn-primary" 
            style={{ width: '100%' }}
            onClick={() => onOpenAuth('login')}
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
