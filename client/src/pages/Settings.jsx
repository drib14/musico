import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  User, 
  Shield,
  MonitorSmartphone,
  LogOut,
  Sliders,
  Volume2,
  Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const { 
    user, 
    logoutUser, 
    setActiveView,
    theme,
    setTheme
  } = useContext(AppContext);
  
  const navigate = useNavigate();
  const [expandedCard, setExpandedCard] = useState(null);

  // Styled Configuration States
  const [crossfade, setCrossfade] = useState(6);
  const [equalizer, setEqualizer] = useState('Bass Boost');
  const [quality, setQuality] = useState('High (320kbps)');
  const [volumeNorm, setVolumeNorm] = useState(true);
  const [language, setLanguage] = useState('English');
  const [shareListening, setShareListening] = useState(true);
  const [publicSearch, setPublicSearch] = useState(true);
  
  // Security Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passMessage, setPassMessage] = useState('');

  const handlePasswordUpdate = (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPassMessage('All fields are required');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassMessage("New passwords don't match");
      return;
    }
    setPassMessage('Password updated successfully!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPassMessage(''), 3000);
  };

  const settingTools = [
    {
      id: 'account',
      title: 'Account Identity',
      desc: 'Verify display credentials, email bindings, and active system memberships.',
      icon: User,
      status: 'Standard Listener'
    },
    {
      id: 'playback',
      title: 'Playback Engine',
      desc: 'Configure linear crossfading presets, equalizer presets, and autoplay queues.',
      icon: Sliders,
      status: 'Adjust Settings'
    },
    {
      id: 'quality',
      title: 'Audio Quality',
      desc: 'Select high-fidelity audio streams and volume normalizations across channels.',
      icon: Volume2,
      status: 'Adjust Quality'
    },
    {
      id: 'interface',
      title: 'App Interface',
      desc: 'Customize theme layers (Space Neon vs Ocean Crisp) and system languages.',
      icon: MonitorSmartphone,
      status: 'Adjust Theme'
    },
    {
      id: 'privacy',
      title: 'Privacy & Sharing',
      desc: 'Toggle social listening activity, followers view, and account privacy options.',
      icon: Eye,
      status: 'Adjust Visibility'
    },
    {
      id: 'security',
      title: 'Access & Security',
      desc: 'Modify account password credentials, verify 2FA, and manage security logs.',
      icon: Shield,
      status: 'Update Security'
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
          Manage your account profile, audio player fidelity, playback, and visibility preferences. Click any card to expand tools.
        </p>
      </div>

      {/* Grid of Settings Tool Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', 
        gap: '20px', 
        width: '100%' 
      }}>
        {settingTools.map((tool) => {
          const Icon = tool.icon;
          const isExpanded = expandedCard === tool.id;
          return (
            <div 
              key={tool.id} 
              className={`concert-card ${isExpanded ? 'active-neon-glow' : ''}`}
              onClick={() => setExpandedCard(isExpanded ? null : tool.id)}
              style={{
                height: isExpanded ? 'auto' : '215px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderRadius: '16px',
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(16px)',
                border: isExpanded ? '1px solid var(--accent)' : '1px solid var(--border-color)',
                boxShadow: isExpanded ? '0 0 20px rgba(0, 242, 254, 0.15), var(--glass-shadow)' : 'var(--glass-shadow)',
                transition: 'all var(--transition-normal)',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer'
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
                </div>

                <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 6px 0', color: '#fff', fontFamily: 'Outfit' }}>
                  {tool.title}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
                  {tool.desc}
                </p>

                {/* Inline Expanded Content Forms */}
                {isExpanded && (
                  <div 
                    onClick={(e) => e.stopPropagation()} 
                    style={{ 
                      marginTop: '20px', 
                      borderTop: '1px solid var(--border-color)', 
                      paddingTop: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      cursor: 'default',
                      animation: 'fadeIn 0.3s ease-out'
                    }}
                  >
                    {/* 1. Playback Engine Form */}
                    {tool.id === 'playback' && (
                      <>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                            Crossfade Duration: {crossfade} seconds
                          </label>
                          <input 
                            type="range" 
                            min="0" 
                            max="12" 
                            value={crossfade} 
                            onChange={(e) => setCrossfade(e.target.value)} 
                            style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }} 
                          />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                            Equalizer Preset
                          </label>
                          <select 
                            value={equalizer} 
                            onChange={(e) => setEqualizer(e.target.value)} 
                            className="form-input" 
                            style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px', outline: 'none' }}
                          >
                            {['Flat', 'Bass Boost', 'Acoustic', 'Vocal', 'Classical', 'Electronic'].map(preset => (
                              <option key={preset} value={preset} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{preset}</option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}

                    {/* 2. Audio Quality Form */}
                    {tool.id === 'quality' && (
                      <>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                            Streaming Audio Quality
                          </label>
                          <select 
                            value={quality} 
                            onChange={(e) => setQuality(e.target.value)} 
                            className="form-input" 
                            style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px', outline: 'none' }}
                          >
                            {['Low (96kbps)', 'Normal (160kbps)', 'High (320kbps)'].map(q => (
                              <option key={q} value={q} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{q}</option>
                            ))}
                          </select>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                          <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '500' }}>Volume Normalization</span>
                          <input 
                            type="checkbox" 
                            checked={volumeNorm} 
                            onChange={(e) => setVolumeNorm(e.target.checked)} 
                            style={{ width: '18px', height: '18px', accentColor: 'var(--accent)', cursor: 'pointer' }} 
                          />
                        </div>
                      </>
                    )}

                    {/* 3. App Interface Form */}
                    {tool.id === 'interface' && (
                      <>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                            App Theme Mode
                          </label>
                          <select 
                            value={theme} 
                            onChange={(e) => setTheme(e.target.value)} 
                            className="form-input" 
                            style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px', outline: 'none' }}
                          >
                            <option value="dark" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Space Neon Dark</option>
                            <option value="light" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Ocean Crisp Light</option>
                          </select>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                            System Language
                          </label>
                          <select 
                            value={language} 
                            onChange={(e) => setLanguage(e.target.value)} 
                            className="form-input" 
                            style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px', outline: 'none' }}
                          >
                            {['English', 'Spanish', 'French', 'German'].map(lang => (
                              <option key={lang} value={lang} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{lang}</option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}

                    {/* 4. Privacy & Sharing Form */}
                    {tool.id === 'privacy' && (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '500' }}>Share Listening Activity</span>
                          <input 
                            type="checkbox" 
                            checked={shareListening} 
                            onChange={(e) => setShareListening(e.target.checked)} 
                            style={{ width: '18px', height: '18px', accentColor: 'var(--accent)', cursor: 'pointer' }} 
                          />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                          <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '500' }}>Searchable Public Profile</span>
                          <input 
                            type="checkbox" 
                            checked={publicSearch} 
                            onChange={(e) => setPublicSearch(e.target.checked)} 
                            style={{ width: '18px', height: '18px', accentColor: 'var(--accent)', cursor: 'pointer' }} 
                          />
                        </div>
                      </>
                    )}

                    {/* 5. Access & Security Form */}
                    {tool.id === 'security' && (
                      <form onSubmit={handlePasswordUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <input 
                          type="password" 
                          placeholder="Current Password" 
                          value={currentPassword} 
                          onChange={(e) => setCurrentPassword(e.target.value)} 
                          className="form-input" 
                          style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px', fontSize: '13px', outline: 'none' }} 
                        />
                        <input 
                          type="password" 
                          placeholder="New Password" 
                          value={newPassword} 
                          onChange={(e) => setNewPassword(e.target.value)} 
                          className="form-input" 
                          style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px', fontSize: '13px', outline: 'none' }} 
                        />
                        <input 
                          type="password" 
                          placeholder="Confirm New Password" 
                          value={confirmPassword} 
                          onChange={(e) => setConfirmPassword(e.target.value)} 
                          className="form-input" 
                          style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '8px', fontSize: '13px', outline: 'none' }} 
                        />
                        {passMessage && (
                          <div style={{ fontSize: '12px', color: passMessage.includes('success') ? 'var(--success)' : 'var(--danger)', fontWeight: 'bold' }}>
                            {passMessage}
                          </div>
                        )}
                        <button 
                          type="submit" 
                          className="btn btn-primary btn-sm" 
                          style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}
                        >
                          Update Password
                        </button>
                      </form>
                    )}

                    {/* 6. Account Identity Details */}
                    {tool.id === 'account' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Display Name:</span>
                          <span style={{ fontWeight: 'bold', color: '#fff' }}>{user?.name || 'Listener'}</span>
                        </div>
                        <div style={{ fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Email Binding:</span>
                          <span style={{ fontWeight: 'bold', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>{user?.email}</span>
                        </div>
                        <div style={{ fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Account Mode:</span>
                          <span style={{ fontWeight: 'bold', color: 'var(--accent)' }}>Free Uncapped Plan</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {!isExpanded && (
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
                  <span style={{ color: 'var(--text-muted)' }}>
                    {tool.status}
                  </span>
                </div>
              )}
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
