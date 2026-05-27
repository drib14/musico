import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { User, Mail, Lock, CheckCircle, Save } from 'lucide-react';

const SettingsView = () => {
  const { API_URL, token, user, loginUser, showToast } = useContext(AppContext);
  
  // Settings form states
  const [name, setName] = useState(user ? user.name : '');
  const [email, setEmail] = useState(user ? user.email : '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
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
    try {
      const body = { name, email };
      if (password) body.password = password;

      const res = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Profile update failed');

      // Update local storage and context state
      loginUser(data.user, data.token); // Re-run loginUser to refresh tokens/profiles safely
      showToast('Profile settings saved successfully!');
      
      // Reset password fields
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      <div>
        <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Profile Settings</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
          Manage your Musico personal profile, update display name, email, or change your password.
        </p>
      </div>

      <form 
        onSubmit={handleUpdateProfile}
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          boxShadow: 'var(--glass-shadow)'
        }}
      >
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

        <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>Change Password</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '-10px' }}>
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

        <button 
          type="submit" 
          className="btn btn-primary"
          style={{ alignSelf: 'flex-end', marginTop: '10px', minWidth: '150px' }}
          disabled={loading}
        >
          {loading ? (
            <div className="spinner"></div>
          ) : (
            <>
              <Save className="w-4 h-4" /> Save Settings
            </>
          )}
        </button>

      </form>

    </div>
  );
};

export default SettingsView;
