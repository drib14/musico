import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  User, 
  Sparkles, 
  Camera, 
  FileText, 
  Image as ImageIcon, 
  Check, 
  ArrowRight,
  HelpCircle
} from 'lucide-react';

const ArtistProfileWizard = ({ onComplete }) => {
  const { API_URL, token, loginUser, showToast } = useContext(AppContext);
  const [loading, setLoading] = useState(false);

  // Profile fields state
  const [artistName, setArtistName] = useState('');
  const [artistBio, setArtistBio] = useState('');
  
  // File upload state
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState('');

  // Handle local image file previews
  const handleAvatarSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 3 * 1024 * 1024) {
        return showToast('Avatar size exceeds 3MB limit', 'error');
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleBannerSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        return showToast('Banner size exceeds 5MB limit', 'error');
      }
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!artistName.trim()) {
      return showToast('Artist/Stage Name is required', 'error');
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('artistName', artistName.trim());
    formData.append('artistBio', artistBio.trim());

    if (avatarFile) formData.append('artistAvatar', avatarFile);
    if (bannerFile) formData.append('artistBanner', bannerFile);

    try {
      const res = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to initialize Artist Profile');

      loginUser(data.user, data.token);
      showToast('Artist Profile initialized! Welcome to the Musico distribution network.');
      
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: '650px',
      margin: '20px auto',
      backgroundColor: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)',
      borderRadius: '20px',
      overflow: 'hidden',
      boxShadow: 'var(--glass-shadow)',
      animation: 'slide-up 0.4s ease'
    }}>
      
      {/* Visual Header Banner Uploader */}
      <div 
        onClick={() => document.getElementById('wizard-banner-input').click()}
        style={{
          width: '100%',
          height: '160px',
          background: bannerPreview 
            ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${bannerPreview}) center/cover no-repeat` 
            : 'linear-gradient(135deg, rgba(13, 21, 39, 0.9) 0%, rgba(59, 130, 246, 0.25) 100%)',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          position: 'relative',
          borderBottom: '1px solid var(--border-color)',
          transition: 'all 0.3s ease'
        }}
      >
        <input 
          id="wizard-banner-input" 
          type="file" 
          accept="image/*" 
          style={{ display: 'none' }} 
          onChange={handleBannerSelect} 
        />
        {!bannerPreview && (
          <>
            <ImageIcon className="w-8 h-8" style={{ color: 'rgba(255,255,255,0.7)', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
            <span style={{ fontSize: '13px', color: '#ffffff', fontWeight: '600', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
              Upload Artist Banner Art
            </span>
          </>
        )}
        {bannerPreview && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#ffffff',
            backgroundColor: 'rgba(7, 10, 19, 0.7)',
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            <Camera className="w-3.5 h-3.5" />
            Change Banner Art
          </div>
        )}
      </div>

      {/* Form Content Wrapper */}
      <form onSubmit={handleSubmit} style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative' }}>
        
        {/* Overlapping Profile Avatar Circle */}
        <div style={{ display: 'flex', gap: '20px', marginTop: '-76px', alignItems: 'flex-end', marginBottom: '8px', zIndex: 5 }}>
          <div 
            onClick={() => document.getElementById('wizard-avatar-input').click()}
            style={{
              position: 'relative',
              width: '88px',
              height: '88px',
              borderRadius: '50%',
              cursor: 'pointer',
              overflow: 'hidden',
              background: 'var(--bg-tertiary)',
              border: '4px solid var(--bg-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 16px rgba(0, 0, 0, 0.4)',
              flexShrink: 0
            }}
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt="Artist Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
              opacity: avatarPreview ? 0 : 1,
              transition: 'opacity 0.2s',
              color: '#ffffff'
            }}
            className="avatar-hover-overlay"
            >
              <Camera className="w-4 h-4" />
            </div>
            
            <input 
              id="wizard-avatar-input" 
              type="file" 
              accept="image/*" 
              style={{ display: 'none' }} 
              onChange={handleAvatarSelect} 
            />
          </div>

          <div style={{ paddingBottom: '8px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '800', lineHeight: '1.2' }}>Setup Artist Persona</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '2px' }}>
              Create your official creator identity to start distributing.
            </p>
          </div>
        </div>

        {/* Artist Stage Name */}
        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            Artist / Stage Name <span style={{ color: 'var(--danger)' }}>*</span>
          </label>
          <div className="form-input-wrapper">
            <User className="form-input-icon" />
            <input
              type="text"
              className="form-input"
              placeholder="e.g. DJ Shadow, Lana Sterling, The Lumineers"
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Artist Biography */}
        <div className="form-group">
          <label className="form-label">Artist Bio (Spotify About Card)</label>
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
                minHeight: '90px',
                outline: 'none',
                lineHeight: '1.6',
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-primary)'
              }}
              placeholder="Tell your future listeners about your music style, production background, and albums..."
              value={artistBio}
              onChange={(e) => setArtistBio(e.target.value)}
            />
          </div>
        </div>

        {/* Feature Info Card */}
        <div style={{
          backgroundColor: 'rgba(59, 130, 246, 0.05)',
          border: '1px solid rgba(59, 130, 246, 0.15)',
          borderRadius: '12px',
          padding: '14px 18px',
          display: 'flex',
          gap: '12px',
          fontSize: '13px',
          color: 'var(--text-secondary)',
          lineHeight: '1.5'
        }}>
          <HelpCircle className="w-5 h-5 text-accent" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Self-Distribution Activation:</strong> Creating your artist identity unlocks the Musico creator network. You will be able to distribute, update, and manage your original tracks (.mp3) directly.
          </div>
        </div>

        {/* Action Button */}
        <button 
          type="submit" 
          className="btn btn-primary"
          style={{ width: '100%', marginTop: '4px', height: '48px', display: 'flex', gap: '8px', fontSize: '15px' }}
          disabled={loading}
        >
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="spinner"></div>
              <span>Creating Official Profile...</span>
            </div>
          ) : (
            <>
              <span>Activate Artist Profile</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

      </form>
    </div>
  );
};

export default ArtistProfileWizard;
