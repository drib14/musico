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
  Settings as SettingsIcon
} from 'lucide-react';

const Settings = () => {
  const { API_URL, token, user, loginUser, showToast, logoutUser, setActiveView } = useContext(AppContext);
  
  // Tab Management state
  const [loading, setLoading] = useState(false);

  // User Settings state
  const [name, setName] = useState(user ? user.name : '');
  const [email, setEmail] = useState(user ? user.email : '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userAvatarFile, setUserAvatarFile] = useState(null);
  const [userAvatarPreview, setUserAvatarPreview] = useState(user?.userAvatar || '');


  // Sync state with user data changes (e.g. after login/re-fetch)
  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setUserAvatarPreview(user.userAvatar || '');
    }
  }, [user]);


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

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    // Core User Settings Validation
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

    setLoading(true);
    const formData = new FormData();
    
    // Append standard profile data
    formData.append('name', name);
    formData.append('email', email);
    if (password) formData.append('password', password);

    try {
      let message = 'Profile settings saved successfully!';
      let tokenToSave = token;

      if (userAvatarFile) formData.append('userAvatar', userAvatarFile);
      const res = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Profile update failed');
      tokenToSave = data.token;

      const meRes = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${tokenToSave}` }
      });
      const meData = await meRes.json();

      // Update local storage and context state
      loginUser(meData, tokenToSave);
      showToast(message);
      
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

      {/* Form Submission */}
      <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
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

            {/* Log Out button for mobile & tablet responsive viewports */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{
                  width: '100%',
                  borderColor: 'var(--danger)',
                  color: 'var(--danger)',
                  backgroundColor: 'rgba(239, 68, 68, 0.04)',
                  padding: '12px',
                  fontWeight: '700',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  borderRadius: '10px'
                }}
                onClick={() => {
                  logoutUser();
                  setActiveView('home');
                }}
              >
                Log Out Account
              </button>
            </div>

          </div>

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

    </div>
  );
};

export default Settings;

