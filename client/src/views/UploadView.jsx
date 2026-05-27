import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  UploadCloud, 
  Music, 
  Image as ImageIcon, 
  Check, 
  Crown, 
  AlertTriangle 
} from 'lucide-react';

const UploadView = () => {
  const { API_URL, token, user, showToast, setActiveView } = useContext(AppContext);
  
  // File states
  const [audioFile, setAudioFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('Pop');

  // Operational states
  const [loading, setLoading] = useState(false);
  const [uploadsCount, setUploadsCount] = useState(0);
  const [limitReached, setLimitReached] = useState(false);
  const [dragActiveAudio, setDragActiveAudio] = useState(false);
  const [dragActiveCover, setDragActiveCover] = useState(false);

  const genres = ['Pop', 'Rock', 'Hip Hop', 'Lo-Fi', 'Electronic', 'Jazz', 'Classical', 'R&B', 'Country'];

  // Check upload count constraints for Free users on render
  useEffect(() => {
    if (token) {
      checkUploadLimit();
    }
  }, [token, user]);

  const checkUploadLimit = async () => {
    try {
      const res = await fetch(`${API_URL}/tracks/my-uploads`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUploadsCount(data.length);
        if (!user?.isPremium && data.length >= 3) {
          setLimitReached(true);
        } else {
          setLimitReached(false);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Drag & Drop handlers for Audio
  const handleAudioDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActiveAudio(true);
    } else if (e.type === "dragleave") {
      setDragActiveAudio(false);
    }
  };

  const handleAudioDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveAudio(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAudioFile(file);
    }
  };

  const handleAudioSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAudioFile(e.target.files[0]);
    }
  };

  const validateAudioFile = (file) => {
    if (!file.type.startsWith('audio/')) {
      showToast('Please upload a valid audio track file (MP3/WAV/etc.)', 'error');
      return;
    }
    if (file.size > 30 * 1024 * 1024) {
      showToast('Audio file size exceeds 30MB limit', 'error');
      return;
    }
    setAudioFile(file);
  };

  // Drag & Drop handlers for Cover
  const handleCoverDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActiveCover(true);
    } else if (e.type === "dragleave") {
      setDragActiveCover(false);
    }
  };

  const handleCoverDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveCover(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateCoverFile(file);
    }
  };

  const handleCoverSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateCoverFile(e.target.files[0]);
    }
  };

  const validateCoverFile = (file) => {
    if (!file.type.startsWith('image/')) {
      showToast('Please upload a valid image file for track cover', 'error');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      showToast('Artwork cover size exceeds 3MB limit', 'error');
      return;
    }
    setCoverFile(file);
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!audioFile) return showToast('Please select an audio track', 'error');
    if (!title) return showToast('Please enter a track title', 'error');

    setLoading(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('genre', genre);
    formData.append('audio', audioFile);
    if (coverFile) formData.append('cover', coverFile);

    try {
      console.log('Sending direct upload files directly to Cloudinary via server middleware...');
      const res = await fetch(`${API_URL}/tracks/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403 && data.limitReached) {
          setLimitReached(true);
        }
        throw new Error(data.message || 'Direct upload failed');
      }

      showToast('Track published and streaming live inside Musico!');
      // Clear forms
      setAudioFile(null);
      setCoverFile(null);
      setTitle('');
      setGenre('Pop');
      
      // Update upload limits check and go to Libraryuploads list
      await checkUploadLimit();
      setActiveView('library');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // RENDER: UPGRADE WARNING CARD IF TIER CONSTRAINT HIT
  if (limitReached) {
    return (
      <div style={{
        maxWidth: '650px',
        margin: '40px auto',
        backgroundColor: 'var(--bg-secondary)',
        border: '2px solid var(--premium-color)',
        borderRadius: '20px',
        padding: '40px',
        textAlign: 'center',
        boxShadow: 'var(--glass-shadow)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px',
        animation: 'slide-up 0.4s ease'
      }}>
        <div style={{
          backgroundColor: 'rgba(245, 158, 11, 0.15)',
          color: 'var(--premium-color)',
          padding: '16px',
          borderRadius: '50%'
        }}>
          <Crown className="w-12 h-12" />
        </div>
        
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '12px' }}>Upload Limit Reached</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.6' }}>
            Free accounts are limited to <strong style={{ color: 'var(--text-primary)' }}>3 direct uploads</strong>. 
            You have already published {uploadsCount} songs on the Musico self-distribution network.
          </p>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-tertiary)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '16px 24px',
          fontSize: '14px',
          width: '100%',
          textAlign: 'left',
          display: 'flex',
          gap: '12px',
          color: 'var(--text-secondary)'
        }}>
          <AlertTriangle className="w-5 h-5 text-premium-color" style={{ flexShrink: 0 }} />
          <span>
            By upgrading to the **Musico Premium Plan**, you get unlimited audio uploads, higher upload size limits, and a premium gold profile badge.
          </span>
        </div>

        <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
          <button 
            className="btn btn-secondary" 
            style={{ flex: 1 }}
            onClick={() => setActiveView('library')}
          >
            Manage Existing Tracks
          </button>
          <button 
            className="btn btn-primary" 
            style={{ flex: 1, backgroundColor: 'var(--premium-color)', background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)' }}
            onClick={() => setActiveView('billing')}
          >
            Upgrade to Premium
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      <div>
        <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Direct Song Distribution</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
          Distribute your tracks directly on Musico. Files are uploaded directly to our cloud network and made instantly streamable.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Row 1: File dropzones */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px' }}>
          
          {/* Audio Drag Area */}
          <div className="form-group">
            <label className="form-label">Audio Track File (.mp3, .wav, .m4a)</label>
            <div
              className={`dropzone ${dragActiveAudio ? 'active' : ''}`}
              onDragEnter={handleAudioDrag}
              onDragOver={handleAudioDrag}
              onDragLeave={handleAudioDrag}
              onDrop={handleAudioDrop}
              onClick={() => document.getElementById('audio-input').click()}
              style={{ height: '180px', justifyContent: 'center' }}
            >
              <input
                id="audio-input"
                type="file"
                accept="audio/*"
                style={{ display: 'none' }}
                onChange={handleAudioSelect}
              />
              {audioFile ? (
                <div className="file-pill">
                  <Check className="w-4 h-4 text-success" />
                  <span>{audioFile.name} ({(audioFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                </div>
              ) : (
                <>
                  <UploadCloud className="dropzone-icon" />
                  <div className="dropzone-title">Drag & Drop track file here</div>
                  <div className="dropzone-subtitle">or click to browse local files (max 30MB)</div>
                </>
              )}
            </div>
          </div>

          {/* Cover Art Drag Area */}
          <div className="form-group">
            <label className="form-label">Artwork Cover Art (.jpg, .png)</label>
            <div
              className={`dropzone ${dragActiveCover ? 'active' : ''}`}
              onDragEnter={handleCoverDrag}
              onDragOver={handleCoverDrag}
              onDragLeave={handleCoverDrag}
              onDrop={handleCoverDrop}
              onClick={() => document.getElementById('cover-input').click()}
              style={{ height: '180px', justifyContent: 'center' }}
            >
              <input
                id="cover-input"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleCoverSelect}
              />
              {coverFile ? (
                <div className="file-pill">
                  <Check className="w-4 h-4 text-success" />
                  <span>{coverFile.name}</span>
                </div>
              ) : (
                <>
                  <ImageIcon className="dropzone-icon" style={{ color: 'var(--text-muted)' }} />
                  <div className="dropzone-title">Cover artwork</div>
                  <div className="dropzone-subtitle">drag image or browse</div>
                </>
              )}
            </div>
          </div>

        </div>

        {/* Row 2: Title and Genre */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px' }}>
          
          <div className="form-group">
            <label className="form-label">Track Title</label>
            <div className="form-input-wrapper">
              <Music className="form-input-icon" />
              <input
                type="text"
                className="form-input"
                placeholder="Name your track"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Genre Selection</label>
            <select
              className="form-input"
              style={{ paddingLeft: '14px', appearance: 'none', background: 'var(--bg-tertiary) url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2364748b\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m6 9 6 6 6-6\'%3E%3C/path%3E%3C/svg%3E") no-repeat right 14px center', backgroundSize: '16px' }}
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
            >
              {genres.map(g => (
                <option key={g} value={g} style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                  {g}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Action Publish Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={() => setActiveView('library')}
          >
            Cancel
          </button>
          
          <button 
            type="submit" 
            className="btn btn-primary"
            style={{ minWidth: '160px' }}
            disabled={loading}
          >
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="spinner"></div>
                <span>Publishing to Cloud...</span>
              </div>
            ) : 'Publish Track'}
          </button>
        </div>

      </form>

    </div>
  );
};

export default UploadView;
