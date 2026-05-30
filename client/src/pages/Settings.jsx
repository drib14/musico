import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  User, 
  Shield,
  MonitorSmartphone,
  LogOut,
  Sliders,
  Volume2,
  Eye,
  Crown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const { 
    user, 
    logoutUser, 
    setActiveView 
  } = useContext(AppContext);
  
  const navigate = useNavigate();

  // Grid tools lists with icons, titles, and details
  const settingTools = [
    {
      id: 'account',
      title: 'Account Identity',
      desc: 'Verify active subscriptions, account credentials, and distribute creator credentials.',
      icon: User,
      status: 'Premium Member'
    },
    {
      id: 'playback',
      title: 'Playback Engine',
      desc: 'Configure linear crossfading, equalizer presets, and autoplay queue continuations.',
      icon: Sliders,
      status: 'Tools Collapsed'
    },
    {
      id: 'quality',
      title: 'Audio Quality',
      desc: 'Select high-fidelity audio streams and volume normalizations across channels.',
      icon: Volume2,
      status: 'Tools Collapsed'
    },
    {
      id: 'interface',
      title: 'App Interface',
      desc: 'Customize light, dark, and system themes along with primary system languages.',
      icon: MonitorSmartphone,
      status: 'Tools Collapsed'
    },
    {
      id: 'privacy',
      title: 'Privacy & Sharing',
      desc: 'Toggle social listening activity, followers view, and account privacy options.',
      icon: Eye,
      status: 'Tools Collapsed'
    },
    {
      id: 'security',
      title: 'Access & Security',
      desc: 'Modify account password credentials, verify 2FA, and manage security logs.',
      icon: Shield,
      status: 'Tools Collapsed'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', padding: '16px', animation: 'fadeIn 0.5s ease-out' }}>
      
      {/* Settings Header banner */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '900', margin: 0, fontFamily: 'Outfit', background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          App Settings
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', maxWidth: '600px', margin: 0 }}>
          Manage your account profile, audio player fidelity, playback, and visibility preferences.
        </p>
      </div>

      {/* Grid of Settings Tool Cards (dont show contents yet) */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '20px', 
        width: '100%' 
      }}>
        {settingTools.map((tool) => {
          const Icon = tool.icon;
          return (
            <div 
              key={tool.id} 
              className="concert-card"
              style={{
                height: '210px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderRadius: '16px',
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(16px)',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--glass-shadow)',
                transition: 'transform var(--transition-normal), border-color var(--transition-normal)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'var(--accent-light)',
                    color: 'var(--accent)'
                  }}>
                    <Icon className="w-5 h-5" />
                  </div>
                  
                  {tool.id === 'account' && (
                    <span className="user-badge" style={{ margin: 0, fontSize: '10px', padding: '2px 8px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Crown style={{ width: '10px', height: '10px' }} /> Premium
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: '17px', fontWeight: '800', margin: '0 0 6px 0', color: '#fff', fontFamily: 'Outfit' }}>
                  {tool.title}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
                  {tool.desc}
                </p>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid var(--border-color)',
                paddingTop: '12px',
                marginTop: '12px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                <span style={{ color: 'var(--text-muted)' }}>Status</span>
                <span style={{ color: tool.id === 'account' ? 'var(--accent)' : 'var(--text-muted)' }}>
                  {tool.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Log Out Action */}
      <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-start' }}>
        <button
          className="btn btn-secondary"
          style={{
            borderColor: 'var(--danger)',
            color: 'var(--danger)',
            backgroundColor: 'rgba(239, 68, 68, 0.04)',
            padding: '12px 24px',
            fontWeight: '800',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderRadius: '24px',
            cursor: 'pointer',
            transition: 'background var(--transition-fast)'
          }}
          onClick={() => {
            logoutUser();
            setActiveView('home');
            navigate('/pages/home');
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.04)'}
        >
          <LogOut className="w-4 h-4" /> Log Out Everywhere
        </button>
      </div>

    </div>
  );
};

export default Settings;
