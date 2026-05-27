import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  User, 
  Mail, 
  Lock, 
  CheckCircle, 
  Save, 
  Crown, 
  Sparkles, 
  Image as ImageIcon, 
  Camera, 
  FileText, 
  Check, 
  Settings
} from 'lucide-react';

const SettingsView = () => {
  const { API_URL, token, user, loginUser, showToast } = useContext(AppContext);
  
  // Tab Management state
  const [activeTab, setActiveTab] = useState('user'); // 'user' or 'artist'
  const [loading, setLoading] = useState(false);

  // User Settings state
  const [name, setName] = useState(user ? user.name : '');
  const [email, setEmail] = useState(user ? user.email : '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userAvatarFile, setUserAvatarFile] = useState(null);
  const [userAvatarPreview, setUserAvatarPreview] = useState(user?.userAvatar || '');

  // Artist Settings state
  const [artistName, setArtistName] = useState(user?.artistName || '');
  const [artistBio, setArtistBio] = useState(user?.artistBio || '');
  const [isArtistVerified, setIsArtistVerified] = useState(user?.isArtistVerified || false);
  const [artistAvatarFile, setArtistAvatarFile] = useState(null);
  const [artistAvatarPreview, setArtistAvatarPreview] = useState(user?.artistAvatar || '');
  const [artistBannerFile, setArtistBannerFile] = useState(null);
  const [artistBannerPreview, setArtistBannerPreview] = useState(user?.artistBanner || '');

  // Billing history states
  const [billingHistory, setBillingHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Sync state with user data changes (e.g. after login/re-fetch)
  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setUserAvatarPreview(user.userAvatar || '');
      setArtistName(user.artistName || '');
      setArtistBio(user.artistBio || '');
      setIsArtistVerified(user.isArtistVerified || false);
      setArtistAvatarPreview(user.artistAvatar || '');
      setArtistBannerPreview(user.artistBanner || '');
    }
  }, [user]);

  useEffect(() => {
    if (token && user && user.isPremium) {
      fetchBillingHistory();
    }
  }, [token, user]);

  const fetchBillingHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`${API_URL}/billing/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBillingHistory(data);
      }
    } catch (err) {
      console.error('Error fetching billing history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Local file selection preview handlers
  const handleUserAvatarSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 3 * 1024 * 1024) {
        return showToast('Avatar size exceeds 3MB limit', 'error');
      }
      setUserAvatarFile(file);
      setUserAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleArtistAvatarSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 3 * 1024 * 1024) {
        return showToast('Avatar size exceeds 3MB limit', 'error');
      }
      setArtistAvatarFile(file);
      setArtistAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleArtistBannerSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        return showToast('Banner size exceeds 5MB limit', 'error');
      }
      setArtistBannerFile(file);
      setArtistBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    // Core User Settings Validation
    if (activeTab === 'user') {
      if (!name || !email) {
        return showToast('Name and email are required fields', 'error');
      }
      if (password) {
        if (password.length < 6) {
          return showToast('Password must be at least 6 characters', 'error');
        }
        if (password !== confirmPassword) {
          return showToast('Passwords do not match', 'error');
        }
      }
    }

    // Artist Settings Validation
    if (activeTab === 'artist') {
      if (!artistName.trim()) {
        return showToast('Artist Name is a required field', 'error');
      }
    }

    setLoading(true);
    const formData = new FormData();
    
    // Append standard profile data
    formData.append('name', name);
    formData.append('email', email);
    if (password) formData.append('password', password);

    // Append Artist profile data
    formData.append('artistName', artistName.trim());
    formData.append('artistBio', artistBio.trim());
    formData.append('isArtistVerified', isArtistVerified);

    // Append image files if selected
    if (userAvatarFile) formData.append('userAvatar', userAvatarFile);
    if (artistAvatarFile) formData.append('artistAvatar', artistAvatarFile);
    if (artistBannerFile) formData.append('artistBanner', artistBannerFile);

    try {
      const res = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
          // CONTENT-TYPE IS AUTO DETECTED BY FETCH TO MULTIPART/FORM-DATA WITH BOUNDARY
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Profile update failed');

      // Update local storage and context state
      loginUser(data.user, data.token);
      showToast('Profile settings saved successfully!');
      
      // Reset password fields
      setPassword('');
      setConfirmPassword('');
      setUserAvatarFile(null);
      setArtistAvatarFile(null);
      setArtistBannerFile(null);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '650px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      <div>
        <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Profile Settings</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
          Manage your Musico personal listener credentials and customize your professional self-distribution artist brand.
        </p>
      </div>

      {/* Spotify-styled Tabs */}
      <div style={{ 
        display: 'flex', 
        borderBottom: '1px solid var(--border-color)',
        gap: '4px',
        margin: '-8px 0'
      }}>
        <button
          className={`btn`}
          onClick={() => setActiveTab('user')}
          style={{
            background: 'none',
            color: activeTab === 'user' ? 'var(--text-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'user' ? '3px solid var(--accent)' : '3px solid transparent',
            borderRadius: '0',
            fontWeight: '700',
            fontSize: '15px',
            padding: '12px 24px',
            boxShadow: 'none'
          }}
        >
          <User className="w-4 h-4" /> User Profile
        </button>
        <button
          className={`btn`}
          onClick={() => setActiveTab('artist')}
          style={{
            background: 'none',
            color: activeTab === 'artist' ? 'var(--text-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'artist' ? '3px solid var(--accent)' : '3px solid transparent',
            borderRadius: '0',
            fontWeight: '700',
            fontSize: '15px',
            padding: '12px 24px',
            boxShadow: 'none'
          }}
        >
          <Sparkles className="w-4 h-4" /> Artist Profile
        </button>
      </div>

      {/* Form Submission */}
      <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {activeTab === 'user' ? (
          // ==================== TAB 1: USER SETTINGS ====================
          <div style={{ 
            backgroundColor: 'var(--bg-secondary)', 
            border: '1px solid var(--border-color)', 
            borderRadius: '20px', 
            padding: '32px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '20px',
            boxShadow: 'var(--glass-shadow)',
            animation: 'fadeIn 0.3s ease'
          }}>
            
            {/* User Avatar Circle Dropzone */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div 
                onClick={() => document.getElementById('user-avatar-input').click()}
                style={{
                  position: 'relative',
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  background: 'var(--bg-tertiary)',
                  border: '2px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                }}
              >
                {userAvatarPreview ? (
                  <img src={userAvatarPreview} alt="User Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <User className="w-10 h-10 text-muted" />
                )}
                
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: userAvatarPreview ? 0 : 1,
                  transition: 'opacity 0.2s',
                  color: '#fff'
                }}
                className="avatar-hover-overlay"
                >
                  <Camera className="w-5 h-5" />
                </div>
              </div>
              <input 
                id="user-avatar-input" 
                type="file" 
                accept="image/*" 
                style={{ display: 'none' }} 
                onChange={handleUserAvatarSelect} 
              />
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>Listener Avatar Image</span>
            </div>

            <div className="form-group">
              <label className="form-label">Display Name</label>
              <div className="form-input-wrapper">
                <User className="form-input-icon" />
                <input
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="form-input-wrapper">
                <Mail className="form-input-icon" />
                <input
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '10px 0' }} />

            <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>Change Password</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '-8px', marginBottom: '4px' }}>
              Leave fields empty if you do not wish to modify your current password.
            </p>

            <div className="form-group">
              <label className="form-label">New Password</label>
              <div className="form-input-wrapper">
                <Lock className="form-input-icon" />
                <input
                  type="password"
                  className="form-input"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <div className="form-input-wrapper">
                <Lock className="form-input-icon" />
                <input
                  type="password"
                  className="form-input"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

          </div>
        ) : (
          // ==================== TAB 2: ARTIST PROFILE SETTINGS ====================
          <div style={{ 
            backgroundColor: 'var(--bg-secondary)', 
            border: '1px solid var(--border-color)', 
            borderRadius: '20px', 
            padding: '32px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '20px',
            boxShadow: 'var(--glass-shadow)',
            animation: 'fadeIn 0.3s ease'
          }}>
            
            {/* Spotify-style landscape banner uploader */}
            <div className="form-group">
              <label className="form-label">Artist Profile Banner (Landscape Header, Max 5MB)</label>
              <div 
                onClick={() => document.getElementById('artist-banner-input').click()}
                style={{
                  width: '100%',
                  height: '140px',
                  borderRadius: '12px',
                  border: '2px dashed var(--border-color)',
                  background: artistBannerPreview ? `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${artistBannerPreview}) center/cover no-repeat` : 'var(--bg-tertiary)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  overflow: 'hidden',
                  position: 'relative',
                  transition: 'border-color 0.2s'
                }}
                className="banner-upload-wrapper"
              >
                <input 
                  id="artist-banner-input" 
                  type="file" 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                  onChange={handleArtistBannerSelect} 
                />
                {!artistBannerPreview && (
                  <>
                    <ImageIcon className="w-8 h-8 text-muted" />
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Upload Landscape Widescreen Banner</span>
                  </>
                )}
                {artistBannerPreview && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fff', backgroundColor: 'rgba(0,0,0,0.6)', padding: '6px 12px', borderRadius: '20px', fontSize: '12px' }}>
                    <Camera className="w-3.5 h-3.5" />
                    Change Banner Image
                  </div>
                )}
              </div>
            </div>

            {/* Circular Artist Avatar & Basic info */}
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '20px', alignItems: 'center' }}>
              <div 
                onClick={() => document.getElementById('artist-avatar-input').click()}
                style={{
                  position: 'relative',
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  background: 'var(--bg-tertiary)',
                  border: '2px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                }}
              >
                {artistAvatarPreview ? (
                  <img src={artistAvatarPreview} alt="Artist Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <User className="w-8 h-8 text-muted" />
                )}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: artistAvatarPreview ? 0 : 1,
                  transition: 'opacity 0.2s',
                  color: '#fff'
                }}
                className="avatar-hover-overlay"
                >
                  <Camera className="w-4 h-4" />
                </div>
                <input 
                  id="artist-avatar-input" 
                  type="file" 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                  onChange={handleArtistAvatarSelect} 
                />
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  Artist / Stage Name <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <div className="form-input-wrapper">
                  <User className="form-input-icon" />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter stage name"
                    value={artistName}
                    onChange={(e) => setArtistName(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Spotify Biography / About Introduction */}
            <div className="form-group">
              <label className="form-label">Artist Biography (Spotify About Section)</label>
              <div className="form-input-wrapper" style={{ alignItems: 'flex-start' }}>
                <FileText className="form-input-icon" style={{ top: '12px' }} />
                <textarea
                  className="form-input"
                  rows="4"
                  style={{
                    padding: '12px 14px 12px 42px',
                    fontFamily: 'inherit',
                    fontSize: '14px',
                    resize: 'vertical',
                    minHeight: '100px',
                    outline: 'none',
                    lineHeight: '1.6'
                  }}
                  placeholder="Share a short story of your music career, monthly listeners background, and creative style..."
                  value={artistBio}
                  onChange={(e) => setArtistBio(e.target.value)}
                />
              </div>
            </div>

            {/* Custom Glowing Verified Toggle Badge */}
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Verified Artist Status
                  {isArtistVerified && (
                    <span 
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        backgroundColor: '#3b82f6',
                        color: '#fff',
                        fontSize: '9px'
                      }}
                    >
                      ✓
                    </span>
                  )}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Showcases the official blue check badge next to your stage name.
                </span>
              </div>

              <div 
                onClick={() => setIsArtistVerified(!isArtistVerified)}
                style={{
                  width: '52px',
                  height: '28px',
                  borderRadius: '99px',
                  backgroundColor: isArtistVerified ? 'var(--accent)' : 'var(--border-color)',
                  padding: '3px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isArtistVerified ? 'flex-end' : 'flex-start',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                <div style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }} />
              </div>
            </div>

            {/* Spotify Introduction Mock card */}
            <div style={{
              backgroundColor: 'rgba(59, 130, 246, 0.05)',
              border: '1px dashed rgba(59, 130, 246, 0.2)',
              borderRadius: '12px',
              padding: '16px',
              fontSize: '13px',
              color: 'var(--text-secondary)',
              lineHeight: '1.5'
            }}>
              💡 <strong>Spotify Showcase:</strong> Adding a Stage Name and bio formats your public profile like Spotify's verified artists. Users see your banner header, a biography about card, and a blue checkmark beside all uploaded tracks.
            </div>

          </div>
        )}

        {/* Global Save Button */}
        <button 
          type="submit" 
          className="btn btn-primary"
          style={{ alignSelf: 'flex-end', marginTop: '4px', minWidth: '160px' }}
          disabled={loading}
        >
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="spinner"></div>
              <span>Saving...</span>
            </div>
          ) : (
            <>
              <Save className="w-4 h-4" /> Save Profile Details
            </>
          )}
        </button>

      </form>

      {/* BILLING HISTORY INVOICE LISTING */}
      {activeTab === 'user' && user && user.isPremium && (
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: 'var(--glass-shadow)',
          animation: 'fadeIn 0.3s ease'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <CheckCircle className="w-5 h-5 text-accent" /> Premium Billing History
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
            Verify your transaction receipts and invoices for your Musico Premium subscription.
          </p>

          <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '4px 0' }} />

          {historyLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
              <div className="spinner"></div>
            </div>
          ) : billingHistory.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px', fontStyle: 'italic' }}>
              No past subscription transactions logged.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {billingHistory.map((tx) => (
                <div key={tx._id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  backgroundColor: 'var(--bg-tertiary)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.03)'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 'bold' }}>
                      Premium Upgrade
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      Ref: {tx.reference} • {new Date(tx.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', color: 'var(--accent)', fontWeight: 'bold' }}>
                      PHP {tx.amount.toFixed(2)}
                    </div>
                    <div style={{
                      display: 'inline-block',
                      fontSize: '10px',
                      backgroundColor: 'rgba(29, 185, 84, 0.15)',
                      color: '#1DB954',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      marginTop: '4px'
                    }}>
                      {tx.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default SettingsView;
