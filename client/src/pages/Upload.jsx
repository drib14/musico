import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import ArtistProfileWizard from '../components/ArtistProfileWizard';
import { 
  UploadCloud, 
  Music, 
  Image as ImageIcon, 
  Check, 
  Crown, 
  AlertTriangle,
  Plus,
  Trash2
} from 'lucide-react';

const Upload = () => {
  const { API_URL, token, user, showToast, setActiveView } = useContext(AppContext);
  
  // Tab control
  const [activeUploadTab, setActiveUploadTab] = useState('single'); // 'single' or 'album'

  // --- SINGLE TRACK STATE ---
  const [audioFile, setAudioFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('Pop');
  const [lyrics, setLyrics] = useState('');
  const [dragActiveAudio, setDragActiveAudio] = useState(false);
  const [dragActiveCover, setDragActiveCover] = useState(false);
  const [contributors, setContributors] = useState({
    mainVocalist: '',
    composer: '',
    lyricist: '',
    producer: ''
  });

  const [audioUrl, setAudioUrl] = useState('');
  const singleAudioRef = React.useRef(null);
  
  useEffect(() => {
    if (audioFile) {
      const url = URL.createObjectURL(audioFile);
      setAudioUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setAudioUrl('');
    }
  }, [audioFile]);

  // --- ALBUM UPLOAD STATE ---
  const [albumName, setAlbumName] = useState('');
  const [albumDescription, setAlbumDescription] = useState('');
  const [albumGenre, setAlbumGenre] = useState('Pop');
  const [albumCoverFile, setAlbumCoverFile] = useState(null);
  const [dragActiveAlbumCover, setDragActiveAlbumCover] = useState(false);
  const [myExistingTracks, setMyExistingTracks] = useState([]);
  const [selectedExistingTrackIds, setSelectedExistingTrackIds] = useState([]);
  const [newAlbumTracks, setNewAlbumTracks] = useState([]); // Array of { title: '', audioFile: null, lyrics: '' }
  const [albumUploadProgress, setAlbumUploadProgress] = useState('');

  // Operational states
  const [loading, setLoading] = useState(false);
  const [uploadsCount, setUploadsCount] = useState(0);
  const [limitReached, setLimitReached] = useState(false);

  const genres = ['Pop', 'Rock', 'Hip Hop', 'Lo-Fi', 'Electronic', 'Jazz', 'Classical', 'Acoustic', 'Folk', 'Metal', 'Ambient', 'Reggae', 'R&B', 'Soundtrack', 'Country'];

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
        setMyExistingTracks(data || []);
        setLimitReached(false); // Platform is 100% free!
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Drag & Drop handlers for Audio (Single)
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
    if (file.size > 50 * 1024 * 1024) {
      showToast('Audio file size exceeds 50MB limit', 'error');
      return;
    }
    setAudioFile(file);
  };

  // Drag & Drop handlers for Cover (Single)
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

  // Drag & Drop handlers for Album Cover
  const handleAlbumCoverDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActiveAlbumCover(true);
    } else if (e.type === "dragleave") {
      setDragActiveAlbumCover(false);
    }
  };

  const handleAlbumCoverDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveAlbumCover(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAlbumCoverFile(file);
    }
  };

  const handleAlbumCoverSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAlbumCoverFile(e.target.files[0]);
    }
  };

  const validateAlbumCoverFile = (file) => {
    if (!file.type.startsWith('image/')) {
      showToast('Please upload a valid image file for album cover', 'error');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      showToast('Album cover artwork exceeds 3MB limit', 'error');
      return;
    }
    setAlbumCoverFile(file);
  };

  // Form submission for Single Song
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!audioFile) return showToast('Please select an audio track', 'error');
    if (!title) return showToast('Please enter a track title', 'error');

    setLoading(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('genre', genre);
    formData.append('lyrics', lyrics);
    formData.append('audio', audioFile);
    formData.append('contributors', JSON.stringify(contributors));
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
        throw new Error(data.message || 'Direct upload failed');
      }

      showToast('Track published and streaming live inside Musico!');
      // Clear forms
      setAudioFile(null);
      setCoverFile(null);
      setTitle('');
      setGenre('Pop');
      setLyrics('');
      setContributors({
        mainVocalist: '',
        composer: '',
        lyricist: '',
        producer: ''
      });
      
      // Update upload limits check and go to Libraryuploads list
      await checkUploadLimit();
      setActiveView('library');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Dynamic Album list rows management
  const handleAddNewTrackRow = () => {
    setNewAlbumTracks([...newAlbumTracks, { 
      title: '', 
      audioFile: null, 
      lyrics: '', 
      coverFile: null,
      contributors: {
        mainVocalist: '',
        composer: '',
        lyricist: '',
        producer: ''
      }
    }]);
  };

  const handleRemoveTrackRow = (idx) => {
    const updated = [...newAlbumTracks];
    updated.splice(idx, 1);
    setNewAlbumTracks(updated);
  };

  const handleUpdateTrackRow = (idx, field, value) => {
    const updated = [...newAlbumTracks];
    updated[idx][field] = value;
    setNewAlbumTracks(updated);
  };

  const handleNewTrackFileSelect = (idx, file) => {
    if (!file.type.startsWith('audio/')) {
      showToast('Please upload a valid audio track file (MP3/WAV/etc.)', 'error');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      showToast('Audio file size exceeds 50MB limit', 'error');
      return;
    }
    handleUpdateTrackRow(idx, 'audioFile', file);
  };

  const handleNewTrackCoverSelect = (idx, file) => {
    if (!file.type.startsWith('image/')) {
      showToast('Please upload a valid image file for track cover', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Track cover file size exceeds 5MB limit', 'error');
      return;
    }
    handleUpdateTrackRow(idx, 'coverFile', file);
  };

  // Album Compilation Submission
  const handleAlbumSubmit = async (e) => {
    e.preventDefault();
    if (!albumName.trim()) return showToast('Please enter an album title', 'error');
    if (!albumCoverFile) return showToast('Please select album cover artwork', 'error');
    if (selectedExistingTrackIds.length === 0 && newAlbumTracks.length === 0) {
      return showToast('Select at least one existing song or upload a new song to build the album', 'error');
    }

    // Validate new track rows
    for (let i = 0; i < newAlbumTracks.length; i++) {
      const t = newAlbumTracks[i];
      if (!t.title.trim()) {
        return showToast(`New Album Track #${i + 1} is missing a Title`, 'error');
      }
      if (!t.audioFile) {
        return showToast(`New Album Track #${i + 1} ("${t.title}") is missing an Audio File`, 'error');
      }
    }

    setLoading(true);
    setAlbumUploadProgress('Compiling distribution elements...');

    try {
      const uploadedTrackIds = [];

      // 1. Upload new tracks sequentially
      for (let i = 0; i < newAlbumTracks.length; i++) {
        const track = newAlbumTracks[i];
        setAlbumUploadProgress(`Uploading song ${i + 1} of ${newAlbumTracks.length}: "${track.title}"...`);

        const trackData = new FormData();
        trackData.append('title', track.title.trim());
        trackData.append('genre', albumGenre);
        trackData.append('lyrics', track.lyrics.trim());
        trackData.append('audio', track.audioFile);
        trackData.append('contributors', JSON.stringify(track.contributors || {
          mainVocalist: '',
          composer: '',
          lyricist: '',
          producer: ''
        }));
        if (track.coverFile) {
          trackData.append('cover', track.coverFile); // specific track cover
        } else {
          trackData.append('cover', albumCoverFile); // inherit album cover
        }

        const trackRes = await fetch(`${API_URL}/tracks/upload`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: trackData
        });

        const trackResult = await trackRes.json();
        if (!trackRes.ok) {
          throw new Error(trackResult.message || `Failed to distribute track "${track.title}"`);
        }
        uploadedTrackIds.push(trackResult.track._id);
      }

      // 2. Merge track arrays
      const allTrackIds = [...selectedExistingTrackIds, ...uploadedTrackIds];
      setAlbumUploadProgress('Finalizing album bundle and cover updates...');

      // 3. POST Album Compilation
      const albumData = new FormData();
      albumData.append('name', albumName.trim());
      albumData.append('description', albumDescription.trim());
      albumData.append('genre', albumGenre);
      albumData.append('cover', albumCoverFile);
      albumData.append('tracks', JSON.stringify(allTrackIds));

      const albumRes = await fetch(`${API_URL}/tracks/albums`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: albumData
      });

      const albumResult = await albumRes.json();
      if (!albumRes.ok) {
        throw new Error(albumResult.message || 'Album publishing failed');
      }

      showToast(`Album "${albumName}" published successfully!`);
      
      // Clear Album forms
      setAlbumName('');
      setAlbumDescription('');
      setAlbumCoverFile(null);
      setSelectedExistingTrackIds([]);
      setNewAlbumTracks([]);
      setAlbumUploadProgress('');

      await checkUploadLimit();
      setActiveView('library');

    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
      setAlbumUploadProgress('');
    }
  };

  // RENDER: REQUIRED ARTIST PROFILE SEED
  if (!user?.artistProfile) {
    return (
      <div style={{ maxWidth: '650px', margin: '40px auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Direct Song Distribution</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
            Before you can distribute original tracks on the Musico network, you must establish your Artist Profile.
          </p>
        </div>
        <ArtistProfileWizard onComplete={checkUploadLimit} />
      </div>
    );
  }



  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div>
        <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Direct Song Distribution</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
          Distribute your tracks directly on Musico. Files are uploaded directly to our cloud network and made instantly streamable.
        </p>

        {/* Dynamic Artist Persona Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '10px 16px',
          marginTop: '16px',
          width: 'fit-content',
          boxShadow: 'var(--glass-shadow)',
          animation: 'fadeIn 0.3s ease'
        }}>
          {user?.artistProfile?.artistAvatar ? (
            <img 
              src={user.artistProfile.artistAvatar}
              alt={user.artistProfile.artistName}
              style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} 
            />
          ) : (
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '12px'
            }}>
              {user?.artistProfile?.artistName?.charAt(0).toUpperCase()}
            </div>
          )}
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Publishing under official artist identity: <strong style={{ color: 'var(--text-primary)' }}>{user?.artistProfile?.artistName}</strong>
          </span>
          {user?.artistProfile?.isArtistVerified && (
            <span 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '15px',
                height: '15px',
                borderRadius: '50%',
                backgroundColor: '#3b82f6',
                color: '#fff',
                fontSize: '8px',
                fontWeight: 'bold'
              }}
              title="Verified check badge"
            >
              ✓
            </span>
          )}
        </div>
      </div>

      {/* Spotify-styled Tabs */}
      <div style={{ 
        display: 'flex', 
        borderBottom: '1px solid var(--border-color)',
        gap: '4px',
        margin: '0 0 -8px 0'
      }}>
        <button
          className="btn"
          type="button"
          onClick={() => setActiveUploadTab('single')}
          style={{
            background: 'none',
            color: activeUploadTab === 'single' ? 'var(--text-primary)' : 'var(--text-secondary)',
            borderBottom: activeUploadTab === 'single' ? '3px solid var(--accent)' : '3px solid transparent',
            borderRadius: '0',
            fontWeight: '700',
            fontSize: '15px',
            padding: '12px 24px',
            boxShadow: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Music className="w-4 h-4" /> Single Track
        </button>
        <button
          className="btn"
          type="button"
          onClick={() => setActiveUploadTab('album')}
          style={{
            background: 'none',
            color: activeUploadTab === 'album' ? 'var(--text-primary)' : 'var(--text-secondary)',
            borderBottom: activeUploadTab === 'album' ? '3px solid var(--accent)' : '3px solid transparent',
            borderRadius: '0',
            fontWeight: '700',
            fontSize: '15px',
            padding: '12px 24px',
            boxShadow: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <UploadCloud className="w-4 h-4" /> Full Album
        </button>
      </div>

      {activeUploadTab === 'single' ? (
        // ==================== TAB 1: SINGLE SONG UPLOAD ====================
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.3s ease' }}>
          
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
                    <div className="dropzone-subtitle">or click to browse local files (max 50MB)</div>
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

          {/* Contributors Input */}
          <div style={{ marginTop: '24px', backgroundColor: 'var(--bg-tertiary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              👥 Track Contributors <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 'normal' }}>(Optional)</span>
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '12px' }}>Main Vocalist</label>
                <input type="text" className="form-input" placeholder="e.g. John Doe" value={contributors.mainVocalist} onChange={(e) => setContributors({ ...contributors, mainVocalist: e.target.value })} style={{ height: '36px', fontSize: '13px' }} />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '12px' }}>Composer</label>
                <input type="text" className="form-input" placeholder="e.g. Jane Doe" value={contributors.composer} onChange={(e) => setContributors({ ...contributors, composer: e.target.value })} style={{ height: '36px', fontSize: '13px' }} />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '12px' }}>Lyricist</label>
                <input type="text" className="form-input" placeholder="e.g. Max Smith" value={contributors.lyricist} onChange={(e) => setContributors({ ...contributors, lyricist: e.target.value })} style={{ height: '36px', fontSize: '13px' }} />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '12px' }}>Producer</label>
                <input type="text" className="form-input" placeholder="e.g. Dr. Dre" value={contributors.producer} onChange={(e) => setContributors({ ...contributors, producer: e.target.value })} style={{ height: '36px', fontSize: '13px' }} />
              </div>
            </div>
          </div>

          {/* Row 3: Optional Scrolling Lyrics */}
          <div className="form-group" style={{ marginTop: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="form-label" style={{ margin: 0 }}>Lyrics (Optional)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="file"
                  accept=".lrc,.txt"
                  id="single-lyrics-file-upload"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        setLyrics(ev.target.result);
                      };
                      reader.readAsText(file);
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => document.getElementById('single-lyrics-file-upload').click()}
                  style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 'bold' }}
                >
                  Upload .LRC / .TXT
                </button>
              </div>
            </div>
            <textarea
              id="single-lyrics-textarea"
              className="form-input"
              rows="6"
              style={{
                padding: '12px 14px',
                fontFamily: 'inherit',
                fontSize: '14px',
                resize: 'vertical',
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                width: '100%',
                minHeight: '120px',
                outline: 'none'
              }}
              placeholder="Type or paste the song lyrics here..."
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
            />
            {audioFile && (
              <div style={{
                marginTop: '12px',
                padding: '16px',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                boxShadow: 'var(--glass-shadow)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    ⏱️ Timed Lyrics Sync Assistant
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Sync your lyrics as you listen</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <audio ref={singleAudioRef} src={audioUrl} style={{ display: 'none' }} />
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: 'var(--bg-tertiary)', padding: '8px 12px', borderRadius: '8px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        if (singleAudioRef.current) {
                          if (singleAudioRef.current.paused) {
                            singleAudioRef.current.play();
                          } else {
                            singleAudioRef.current.pause();
                          }
                        }
                      }}
                      className="btn btn-primary btn-sm"
                      style={{ padding: '6px 12px', borderRadius: '4px', fontSize: '12px' }}
                    >
                      Play / Pause
                    </button>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Use this player to sync lyrics</span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      const audio = singleAudioRef.current;
                      if (!audio) return;
                      const time = audio.currentTime;
                      const mins = Math.floor(time / 60).toString().padStart(2, '0');
                      const secs = Math.floor(time % 60).toString().padStart(2, '0');
                      const stamp = `[${mins}:${secs}] `;
                      
                      const textarea = document.getElementById('single-lyrics-textarea');
                      if (textarea) {
                        const start = textarea.selectionStart;
                        const end = textarea.selectionEnd;
                        const text = textarea.value;
                        const before = text.substring(0, start);
                        const after = text.substring(end, text.length);
                        setLyrics(before + stamp + after);
                        setTimeout(() => {
                          textarea.focus();
                          textarea.setSelectionRange(start + stamp.length, start + stamp.length);
                        }, 50);
                      } else {
                        setLyrics(prev => prev + stamp);
                      }
                    }}
                    style={{
                      padding: '8px 14px',
                      fontSize: '12.5px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    ⏱️ Stamp Current Time
                  </button>
                  
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      if (!lyrics.trim()) return showToast('Please type some lyrics first!', 'error');
                      const lines = lyrics.split('\n');
                      let time = 0;
                      const stamped = lines.map(line => {
                        if (line.trim().length === 0) return line;
                        const clean = line.replace(/^\[\d{2}:\d{2}\]\s*/, '');
                        const mins = Math.floor(time / 60).toString().padStart(2, '0');
                        const secs = Math.floor(time % 60).toString().padStart(2, '0');
                        const res = `[${mins}:${secs}] ${clean}`;
                        time += 4;
                        return res;
                      });
                      setLyrics(stamped.join('\n'));
                      showToast('Auto-generated template timestamps every 4 seconds!');
                    }}
                    style={{
                      padding: '8px 14px',
                      fontSize: '12.5px',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    🪄 Auto-Stamp Template
                  </button>

                  <a
                    href="https://github.com/m-bain/whisperX"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                    style={{
                      padding: '8px 14px',
                      fontSize: '12.5px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      textDecoration: 'none',
                      color: 'inherit'
                    }}
                  >
                    🤖 WhisperX AI Sync Tool
                  </a>
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  💡 <strong>Tip:</strong> Play your song above. Click <strong>Stamp Current Time</strong> at the exact start of a line to insert the <code>[mm:ss]</code> timestamp. Timed lyrics let listeners scrub through your song by tapping lines!
                </div>
              </div>
            )}
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
      ) : (
        // ==================== TAB 2: ALBUM UPLOAD COMPILER ====================
        <form onSubmit={handleAlbumSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.3s ease' }}>
          
          {/* Real-time Compilation Status Indicator */}
          {albumUploadProgress && (
            <div style={{
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              borderRadius: '12px',
              padding: '16px',
              color: 'var(--accent)',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div className="spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(59, 130, 246, 0.2)', borderTopColor: 'var(--accent)', margin: 0 }}></div>
              <span>{albumUploadProgress}</span>
            </div>
          )}

          {/* Album Details Header Block */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Album Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Echoes of Sunset"
                  value={albumName}
                  onChange={(e) => setAlbumName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Genre Selection</label>
                <select
                  className="form-input"
                  style={{ paddingLeft: '14px', appearance: 'none', background: 'var(--bg-tertiary) url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2364748b\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m6 9 6 6 6-6\'%3E%3C/path%3E%3C/svg%3E") no-repeat right 14px center', backgroundSize: '16px' }}
                  value={albumGenre}
                  onChange={(e) => setAlbumGenre(e.target.value)}
                >
                  {genres.map(g => (
                    <option key={g} value={g} style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Album Cover Art Dropzone */}
            <div className="form-group">
              <label className="form-label">Album Cover Artwork (Max 3MB)</label>
              <div
                className={`dropzone ${dragActiveAlbumCover ? 'active' : ''}`}
                onDragEnter={handleAlbumCoverDrag}
                onDragOver={handleAlbumCoverDrag}
                onDragLeave={handleAlbumCoverDrag}
                onDrop={handleAlbumCoverDrop}
                onClick={() => document.getElementById('album-cover-input').click()}
                style={{ height: '142px', justifyContent: 'center' }}
              >
                <input
                  id="album-cover-input"
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleAlbumCoverSelect}
                />
                {albumCoverFile ? (
                  <div className="file-pill" style={{ margin: 0 }}>
                    <Check className="w-4 h-4 text-success" />
                    <span>{albumCoverFile.name}</span>
                  </div>
                ) : (
                  <>
                    <ImageIcon className="dropzone-icon" style={{ color: 'var(--text-muted)', width: '28px', height: '28px', marginBottom: '4px' }} />
                    <div style={{ fontSize: '13px', fontWeight: 'bold' }}>Drop Album Artwork</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>click or drag image</div>
                  </>
                )}
              </div>
            </div>

          </div>

          <div className="form-group">
            <label className="form-label">Album Description (Optional)</label>
            <textarea
              className="form-input"
              rows="3"
              placeholder="Give your fans some background context or inspiration behind this album collection..."
              value={albumDescription}
              onChange={(e) => setAlbumDescription(e.target.value)}
              style={{ padding: '12px 14px', fontFamily: 'inherit', fontSize: '14px', resize: 'vertical' }}
            />
          </div>

          {/* Section 1: Checklist of Existing Songs */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Check className="w-5 h-5 text-accent" /> Include Existing Uploaded Songs
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12.5px', marginBottom: '12px' }}>
              Select any of your previously published singles to group them under this official album collection.
            </p>

            {myExistingTracks.length > 0 ? (
              <div style={{
                maxHeight: '220px',
                overflowY: 'auto',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                backgroundColor: 'var(--bg-tertiary)'
              }}>
                {myExistingTracks.map((t) => {
                  const isChecked = selectedExistingTrackIds.includes(t._id);
                  return (
                    <label 
                      key={t._id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '8px',
                        borderRadius: '6px',
                        backgroundColor: isChecked ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                        border: isChecked ? '1px solid rgba(59, 130, 246, 0.25)' : '1px solid transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setSelectedExistingTrackIds(selectedExistingTrackIds.filter(id => id !== t._id));
                          } else {
                            setSelectedExistingTrackIds([...selectedExistingTrackIds, t._id]);
                          }
                        }}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      {t.coverUrl ? (
                        <img src={t.coverUrl} alt={t.title} style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '32px', height: '32px', borderRadius: '4px', backgroundColor: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Music className="w-4 h-4 text-muted" />
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.genre}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: '16px', textAlign: 'center', border: '1px dashed var(--border-color)', borderRadius: '10px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                No existing uploads found. Add your first original songs as new tracks below!
              </div>
            )}
          </div>

          {/* Section 2: Upload New Songs directly inside Album */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus className="w-5 h-5 text-accent" /> Upload New Tracks inside Album
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12.5px', marginBottom: '16px' }}>
              Add new, unreleased songs that will be distributed and published live as part of this album collection.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {newAlbumTracks.map((track, idx) => (
                <div 
                  key={idx}
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    position: 'relative',
                    animation: 'fadeIn 0.2s ease'
                  }}
                >
                  {/* Row Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--accent)', letterSpacing: '0.5px' }}>
                      New Song #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTrackRow(idx)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--danger)',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      title="Remove song row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Input details */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Song Title *</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Name your track"
                        value={track.title}
                        onChange={(e) => handleUpdateTrackRow(idx, 'title', e.target.value)}
                        style={{ height: '38px', fontSize: '13px' }}
                        required
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Audio File (.mp3/.wav/.m4a) *</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '38px' }}>
                        <input
                          type="file"
                          accept="audio/*"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleNewTrackFileSelect(idx, e.target.files[0]);
                            }
                          }}
                          style={{ display: 'none' }}
                          id={`album-track-file-${idx}`}
                        />
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => document.getElementById(`album-track-file-${idx}`).click()}
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          {track.audioFile ? '✓ Change Audio' : 'Select Audio'}
                        </button>
                        {track.audioFile && (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }} title={track.audioFile.name}>
                            {track.audioFile.name}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Individual Track Cover (Optional)</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '38px' }}>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleNewTrackCoverSelect(idx, e.target.files[0]);
                            }
                          }}
                          style={{ display: 'none' }}
                          id={`album-track-cover-${idx}`}
                        />
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => document.getElementById(`album-track-cover-${idx}`).click()}
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          {track.coverFile ? '✓ Change Cover' : 'Select Cover'}
                        </button>
                        {track.coverFile && (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px' }} title={track.coverFile.name}>
                            {track.coverFile.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '12px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Contributors (Optional)</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                      <input type="text" className="form-input" placeholder="Main Vocalist" value={track.contributors?.mainVocalist || ''} onChange={(e) => handleUpdateTrackRow(idx, 'contributors', { ...track.contributors, mainVocalist: e.target.value })} style={{ height: '32px', fontSize: '12px' }} />
                      <input type="text" className="form-input" placeholder="Composer" value={track.contributors?.composer || ''} onChange={(e) => handleUpdateTrackRow(idx, 'contributors', { ...track.contributors, composer: e.target.value })} style={{ height: '32px', fontSize: '12px' }} />
                      <input type="text" className="form-input" placeholder="Lyricist" value={track.contributors?.lyricist || ''} onChange={(e) => handleUpdateTrackRow(idx, 'contributors', { ...track.contributors, lyricist: e.target.value })} style={{ height: '32px', fontSize: '12px' }} />
                      <input type="text" className="form-input" placeholder="Producer" value={track.contributors?.producer || ''} onChange={(e) => handleUpdateTrackRow(idx, 'contributors', { ...track.contributors, producer: e.target.value })} style={{ height: '32px', fontSize: '12px' }} />
                    </div>
                  </div>

                  {/* Lyrics row */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Scrolling Lyrics (Optional)</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="file"
                          accept=".lrc,.txt"
                          id={`album-track-lyrics-file-${idx}`}
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                handleUpdateTrackRow(idx, 'lyrics', ev.target.result);
                              };
                              reader.readAsText(file);
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => document.getElementById(`album-track-lyrics-file-${idx}`).click()}
                          style={{ padding: '2px 8px', fontSize: '10px', fontWeight: 'bold' }}
                        >
                          Upload .LRC
                        </button>
                      </div>
                    </div>
                    <textarea
                      id={`album-track-lyrics-textarea-${idx}`}
                      className="form-input"
                      rows="2"
                      placeholder="Type or paste timed lyrics here..."
                      value={track.lyrics}
                      onChange={(e) => handleUpdateTrackRow(idx, 'lyrics', e.target.value)}
                      style={{ fontSize: '12.5px', padding: '8px 12px', fontFamily: 'inherit', resize: 'vertical' }}
                    />
                    {track.audioFile && (
                      <div style={{
                        marginTop: '8px',
                        padding: '12px',
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--accent)' }}>⏱️ Timed Lyrics Assistant (Track #{idx + 1})</span>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <audio
                            id={`album-preview-audio-${idx}`}
                            src={URL.createObjectURL(track.audioFile)}
                            style={{ display: 'none' }}
                          />
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: 'var(--bg-primary)', padding: '6px 10px', borderRadius: '6px' }}>
                            <button
                              type="button"
                              onClick={() => {
                                const audioEl = document.getElementById(`album-preview-audio-${idx}`);
                                if (audioEl) {
                                  if (audioEl.paused) audioEl.play();
                                  else audioEl.pause();
                                }
                              }}
                              className="btn btn-primary btn-sm"
                              style={{ padding: '4px 10px', borderRadius: '4px', fontSize: '11px' }}
                            >
                              Play / Pause
                            </button>
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              const audio = document.getElementById(`album-preview-audio-${idx}`);
                              if (!audio) return;
                              const time = audio.currentTime;
                              const mins = Math.floor(time / 60).toString().padStart(2, '0');
                              const secs = Math.floor(time % 60).toString().padStart(2, '0');
                              const stamp = `[${mins}:${secs}] `;
                              
                              const textarea = document.getElementById(`album-track-lyrics-textarea-${idx}`);
                              if (textarea) {
                                const start = textarea.selectionStart;
                                const end = textarea.selectionEnd;
                                const text = textarea.value;
                                const before = text.substring(0, start);
                                const after = text.substring(end, text.length);
                                handleUpdateTrackRow(idx, 'lyrics', before + stamp + after);
                                setTimeout(() => {
                                  textarea.focus();
                                  textarea.setSelectionRange(start + stamp.length, start + stamp.length);
                                }, 50);
                              } else {
                                handleUpdateTrackRow(idx, 'lyrics', track.lyrics + stamp);
                              }
                            }}
                            style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 'bold' }}
                          >
                            ⏱️ Stamp Current Time
                          </button>
                          
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              if (!track.lyrics.trim()) return showToast('Please type some lyrics first!', 'error');
                              const lines = track.lyrics.split('\n');
                              let time = 0;
                              const stamped = lines.map(line => {
                                if (line.trim().length === 0) return line;
                                const clean = line.replace(/^\[\d{2}:\d{2}\]\s*/, '');
                                const mins = Math.floor(time / 60).toString().padStart(2, '0');
                                const secs = Math.floor(time % 60).toString().padStart(2, '0');
                                const res = `[${mins}:${secs}] ${clean}`;
                                time += 4;
                                return res;
                              });
                              handleUpdateTrackRow(idx, 'lyrics', stamped.join('\n'));
                              showToast('Auto-generated template timestamps every 4 seconds!');
                            }}
                            style={{ padding: '4px 10px', fontSize: '11px' }}
                          >
                            🪄 Auto-Stamp Template
                          </button>

                          <a
                            href="https://github.com/m-bain/whisperX"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary btn-sm"
                            style={{
                              padding: '4px 10px',
                              fontSize: '11px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              textDecoration: 'none',
                              color: 'inherit'
                            }}
                          >
                            🤖 WhisperX AI Sync
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              ))}

              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleAddNewTrackRow}
                style={{
                  alignSelf: 'flex-start',
                  padding: '8px 18px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginTop: '4px'
                }}
              >
                <Plus className="w-4 h-4" /> Add New Track
              </button>
            </div>
          </div>

          {/* Album submission action bar */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginTop: '12px' }}>
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
              style={{ minWidth: '180px' }}
              disabled={loading}
            >
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="spinner"></div>
                  <span>Publishing Album...</span>
                </div>
              ) : 'Publish Full Album'}
            </button>
          </div>

        </form>
      )}

    </div>
  );
};

export default Upload;

