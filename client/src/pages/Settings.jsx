import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  User, 
  Mail, 
  Lock, 
  Shield,
  CreditCard,
  MonitorSmartphone,
  LogOut,
  ChevronRight,
  Music,
  Sliders,
  Volume2,
  Globe,
  Eye,
  SlidersHorizontal,
  Crown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const { 
    API_URL, 
    token, 
    user, 
    theme, 
    setTheme, 
    showToast, 
    logoutUser, 
    setActiveView 
  } = useContext(AppContext);
  
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Security Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Local/Storage State for other cards to be fully functional
  const [streamQuality, setStreamQuality] = useState(() => localStorage.getItem('musico_quality') || 'high');
  const [autoNormalize, setAutoNormalize] = useState(() => localStorage.getItem('musico_normalize') !== 'false');
  const [autoplayNext, setAutoplayNext] = useState(() => localStorage.getItem('musico_autoplay') !== 'false');
  const [eqPreset, setEqPreset] = useState(() => localStorage.getItem('musico_eq') || 'bass');
  const [crossfade, setCrossfade] = useState(() => parseInt(localStorage.getItem('musico_crossfade') || '4', 10));
  const [language, setLanguage] = useState(() => localStorage.getItem('musico_lang') || 'en');
  const [shareActivity, setShareActivity] = useState(() => localStorage.getItem('musico_share_activity') !== 'false');
  const [privateProfile, setPrivateProfile] = useState(() => localStorage.getItem('musico_private_profile') === 'true');

  useEffect(() => {
    localStorage.setItem('musico_quality', streamQuality);
  }, [streamQuality]);

  useEffect(() => {
    localStorage.setItem('musico_normalize', autoNormalize);
  }, [autoNormalize]);

  useEffect(() => {
    localStorage.setItem('musico_autoplay', autoplayNext);
  }, [autoplayNext]);

  useEffect(() => {
    localStorage.setItem('musico_eq', eqPreset);
  }, [eqPreset]);

  useEffect(() => {
    localStorage.setItem('musico_crossfade', crossfade);
  }, [crossfade]);

  useEffect(() => {
    localStorage.setItem('musico_lang', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('musico_share_activity', shareActivity);
  }, [shareActivity]);

  useEffect(() => {
    localStorage.setItem('musico_private_profile', privateProfile);
  }, [privateProfile]);

  const handleUpdateSecurity = async (e) => {
    e.preventDefault();
    
    if (!currentPassword) {
      return showToast('Please enter your current password', 'error');
    }
    if (!newPassword || newPassword.length < 6) {
      return showToast('New password must be at least 6 characters', 'error');
    }
    if (newPassword !== confirmPassword) {
      return showToast('Passwords do not match', 'error');
    }

    setLoading(true);
    
    try {
      const res = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          password: newPassword 
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Security update failed');

      showToast('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleOption = (setter, val, label) => {
    setter(val);
    showToast(`${label} settings updated`);
  };

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '60px' }}>
      
      <div>
        <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Settings</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
          Customize your streaming quality, audio filters, preferences, and account security.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        
        {/* Card 1: Account Overview */}
        <div className="concert-card" style={{ height: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <User className="w-5 h-5 text-accent" /> Account Overview
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Email Address</span>
              <span style={{ fontWeight: '600' }}>{user?.email}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Subscription Plan</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="user-badge" style={{ margin: 0, padding: '3px 10px', fontSize: '11px' }}>
                  <Crown className="w-3 h-3" /> Premium (Full Tier)
                </span>
              </div>
            </div>
            <div 
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', paddingTop: '8px' }}
              onClick={() => { setActiveView('profile'); navigate('/pages/profile'); }}
            >
              <span style={{ color: 'var(--accent)', fontSize: '14px', fontWeight: '700' }}>Manage Public User Profile</span>
              <ChevronRight className="w-5 h-5 text-accent" />
            </div>
          </div>
        </div>

        {/* Card 2: Audio Playback & Equalizer Options */}
        <div className="concert-card" style={{ height: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <Sliders className="w-5 h-5 text-accent" /> Playback Preferences & Equalizer
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Autoplay toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600' }}>Autoplay Similar Content</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Automatically stream recommended tracks once your queue finishes.</div>
              </div>
              <input 
                type="checkbox" 
                checked={autoplayNext} 
                onChange={(e) => handleToggleOption(setAutoplayNext, e.target.checked, 'Autoplay')}
                style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--accent)' }}
              />
            </div>

            {/* EQ Selector */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600' }}>Equalizer Acoustic Preset</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Optimize dynamic frequency distributions for your speakers.</div>
              </div>
              <select
                value={eqPreset}
                onChange={(e) => handleToggleOption(setEqPreset, e.target.value, 'Equalizer')}
                className="form-input"
                style={{ width: 'auto', padding: '6px 32px 6px 12px', fontSize: '13px', appearance: 'none', cursor: 'pointer', height: '36px' }}
              >
                <option value="flat">Flat (Default)</option>
                <option value="bass">Bass Boost</option>
                <option value="acoustic">Acoustic Clear</option>
                <option value="vocal">Vocal Presence</option>
                <option value="electronic">Club / Electronic</option>
                <option value="classical">High Treble / Classical</option>
              </select>
            </div>

            {/* Crossfade slider */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600' }}>Crossfade Transitions</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Fades the end of a song into the beginning of the next track.</div>
                </div>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--accent)' }}>{crossfade} seconds</span>
              </div>
              <input
                type="range"
                min="0"
                max="12"
                value={crossfade}
                onChange={(e) => setCrossfade(parseInt(e.target.value, 10))}
                style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--accent)' }}
              />
            </div>

          </div>
        </div>

        {/* Card 3: Audio Streaming Quality */}
        <div className="concert-card" style={{ height: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <Volume2 className="w-5 h-5 text-accent" /> Audio Quality Settings
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Quality selector */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600' }}>Streaming Quality Profile</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Select your streaming fidelity (higher consumes more bandwidth).</div>
              </div>
              <select
                value={streamQuality}
                onChange={(e) => handleToggleOption(setStreamQuality, e.target.value, 'Audio quality')}
                className="form-input"
                style={{ width: 'auto', padding: '6px 32px 6px 12px', fontSize: '13px', appearance: 'none', cursor: 'pointer', height: '36px' }}
              >
                <option value="low">Low (96 kbps)</option>
                <option value="normal">Normal (160 kbps)</option>
                <option value="high">High Fidelity (320 kbps)</option>
              </select>
            </div>

            {/* Normalization Toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600' }}>Normalize Audio Output Volume</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Keep volume levels uniform across all audio files and channels.</div>
              </div>
              <input 
                type="checkbox" 
                checked={autoNormalize} 
                onChange={(e) => handleToggleOption(setAutoNormalize, e.target.checked, 'Normalization')}
                style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--accent)' }}
              />
            </div>

          </div>
        </div>

        {/* Card 4: Theme Preferences */}
        <div className="concert-card" style={{ height: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <MonitorSmartphone className="w-5 h-5 text-accent" /> Interface & Custom Theme
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Theme Select */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600' }}>Select App Theme Style</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Select your primary UI mode preference.</div>
              </div>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="form-input"
                style={{ width: 'auto', padding: '6px 32px 6px 12px', fontSize: '13px', appearance: 'none', cursor: 'pointer', height: '36px' }}
              >
                <option value="system">System Default</option>
                <option value="dark">Dark Mode</option>
                <option value="light">Light Mode</option>
              </select>
            </div>

            {/* Language Select */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600' }}>System Language Profile</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Configure primary localization and numeric formats.</div>
              </div>
              <select
                value={language}
                onChange={(e) => handleToggleOption(setLanguage, e.target.value, 'Language')}
                className="form-input"
                style={{ width: 'auto', padding: '6px 32px 6px 12px', fontSize: '13px', appearance: 'none', cursor: 'pointer', height: '36px' }}
              >
                <option value="en">English (US)</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
                <option value="ja">日本語</option>
              </select>
            </div>

          </div>
        </div>

        {/* Card 5: Privacy Settings */}
        <div className="concert-card" style={{ height: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <Eye className="w-5 h-5 text-accent" /> Privacy & Visibility
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Listening activity toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600' }}>Share Listening Activity</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Show what you are currently streaming to your followers.</div>
              </div>
              <input 
                type="checkbox" 
                checked={shareActivity} 
                onChange={(e) => handleToggleOption(setShareActivity, e.target.checked, 'Privacy activity')}
                style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--accent)' }}
              />
            </div>

            {/* Profile privacy toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600' }}>Private Account Mode</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Restrict public visibility of your liked tracks and created playlists.</div>
              </div>
              <input 
                type="checkbox" 
                checked={privateProfile} 
                onChange={(e) => handleToggleOption(setPrivateProfile, e.target.checked, 'Account privacy')}
                style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--accent)' }}
              />
            </div>

          </div>
        </div>

        {/* Card 6: Account Credentials & Security Change */}
        <div className="concert-card" style={{ height: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <Shield className="w-5 h-5 text-accent" /> Change Password
          </h2>
          
          <form onSubmit={handleUpdateSecurity} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: '0' }}>
                <label className="form-label" style={{ fontSize: '12px' }}>Current Password</label>
                <div className="form-input-wrapper">
                  <Lock className="form-input-icon" />
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    style={{ height: '38px', fontSize: '13px' }}
                  />
                </div>
              </div>
              
              <div className="form-group" style={{ marginBottom: '0' }}>
                <label className="form-label" style={{ fontSize: '12px' }}>New Password</label>
                <div className="form-input-wrapper">
                  <Lock className="form-input-icon" />
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Minimum 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{ height: '38px', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '0' }}>
                <label className="form-label" style={{ fontSize: '12px' }}>Confirm Password</label>
                <div className="form-input-wrapper">
                  <Lock className="form-input-icon" />
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{ height: '38px', fontSize: '13px' }}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ alignSelf: 'flex-start', padding: '10px 24px', fontSize: '13px', borderRadius: '20px', marginTop: '4px' }}
              disabled={loading}
            >
              {loading ? 'Saving security...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Log Out Action */}
        <button
          className="btn btn-secondary"
          style={{
            borderColor: 'var(--danger)',
            color: 'var(--danger)',
            backgroundColor: 'rgba(239, 68, 68, 0.04)',
            padding: '14px',
            fontWeight: '800',
            fontSize: '15px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            borderRadius: '12px',
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
          <LogOut className="w-5 h-5" /> Log Out Everywhere
        </button>

      </div>
    </div>
  );
};

export default Settings;
