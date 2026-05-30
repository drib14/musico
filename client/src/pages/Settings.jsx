import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  User, 
  Mail, 
  Lock, 
  Save, 
  Shield,
  CreditCard,
  MonitorSmartphone,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const { API_URL, token, user, theme, setTheme, showToast, logoutUser, setActiveView } = useContext(AppContext);
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);

  // Security Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleUpdateSecurity = async (e) => {
    e.preventDefault();
    
    if (!newPassword || newPassword.length < 6) {
      return showToast('New password must be at least 6 characters', 'error');
    }
    if (newPassword !== confirmPassword) {
      return showToast('Passwords do not match', 'error');
    }

    setLoading(true);
    
    try {
      // In a real app we'd need a route that verifies current password and sets new one.
      // Assuming we're re-using the profile PUT route if it accepts password changes.
      const formData = new FormData();
      formData.append('password', newPassword);

      const res = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
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

  return (
    <div style={{ maxWidth: '650px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '40px' }}>
      
      <div>
        <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Settings</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
          Manage your account credentials, security, and app preferences.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Account Overview Card */}
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: 'var(--glass-shadow)',
          animation: 'fadeIn 0.3s ease'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User className="w-5 h-5 text-accent" /> Account Overview
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Email Address</span>
              <span style={{ fontWeight: '500' }}>{user?.email}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Subscription Plan</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: '800', color: 'var(--premium-color)' }}>Premium</span>
              </div>
            </div>
            <div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              onClick={() => { setActiveView('profile'); navigate('/pages/profile'); }}
            >
              <span style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: '600' }}>Edit Public Profile</span>
              <ChevronRight className="w-5 h-5 text-muted" />
            </div>
          </div>
        </div>

        {/* Security Card */}
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          boxShadow: 'var(--glass-shadow)'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield className="w-5 h-5 text-accent" /> Security
          </h2>
          <form onSubmit={handleUpdateSecurity} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group" style={{ marginBottom: '0' }}>
              <label className="form-label" style={{ fontSize: '13px' }}>Current Password</label>
              <div className="form-input-wrapper">
                <Lock className="form-input-icon" />
                <input
                  type="password"
                  className="form-input"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: '0' }}>
              <label className="form-label" style={{ fontSize: '13px' }}>New Password</label>
              <div className="form-input-wrapper">
                <Lock className="form-input-icon" />
                <input
                  type="password"
                  className="form-input"
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: '0' }}>
              <label className="form-label" style={{ fontSize: '13px' }}>Confirm New Password</label>
              <div className="form-input-wrapper">
                <Lock className="form-input-icon" />
                <input
                  type="password"
                  className="form-input"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ alignSelf: 'flex-start', padding: '10px 20px', fontSize: '13px' }}
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* App Preferences Card */}
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: 'var(--glass-shadow)'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MonitorSmartphone className="w-5 h-5 text-accent" /> App Preferences
          </h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: '500' }}>Theme Preference</span>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="form-input"
              style={{ width: 'auto', padding: '8px 32px 8px 12px', fontSize: '13px', appearance: 'none', cursor: 'pointer' }}
            >
              <option value="system">System Default</option>
              <option value="dark">Dark Mode</option>
              <option value="light">Light Mode</option>
            </select>
          </div>
        </div>

        {/* Log Out Action */}
        <button
          className="btn btn-secondary"
          style={{
            borderColor: 'var(--danger)',
            color: 'var(--danger)',
            backgroundColor: 'rgba(239, 68, 68, 0.04)',
            padding: '14px',
            fontWeight: '700',
            fontSize: '15px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            borderRadius: '12px'
          }}
          onClick={() => {
            logoutUser();
            setActiveView('home');
            navigate('/pages/home');
          }}
        >
          <LogOut className="w-5 h-5" /> Log Out Everywhere
        </button>

      </div>
    </div>
  );
};

export default Settings;

