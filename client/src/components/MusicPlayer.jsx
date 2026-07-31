import React, { useContext, useState, useEffect, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Shuffle, 
  Repeat, 
  Volume2, 
  VolumeX, 
  Heart,
  Music,
  Mic,
  Plus,
  ListPlus,
  Server,
  Wifi,
  Check
} from 'lucide-react';

const MusicPlayer = () => {
  const { 
    currentTrack, 
    isPlaying, 
    togglePlay, 
    nextTrack, 
    prevTrack, 
    shuffle, 
    setShuffle, 
    repeat, 
    setRepeat, 
    volume, 
    setVolume, 
    muted, 
    setMuted, 
    audioRef,
    user,
    toggleLike,
    adActive,
    adCountdown,
    setActiveView,
    showLyrics,
    setShowLyrics,
    token,
    userPlaylists,
    loadUserPlaylists,
    showToast,
    API_URL,
    triggerProfileView,
    currentServerIndex,
    getAvailableServers,
    switchStreamServer
  } = useContext(AppContext);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [showPlaylistDropdown, setShowPlaylistDropdown] = useState(false);
  const [showServerDropdown, setShowServerDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const serverDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowPlaylistDropdown(false);
      }
      if (serverDropdownRef.current && !serverDropdownRef.current.contains(event.target)) {
        setShowServerDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleAddToPlaylist = async (playlistId, playlistName) => {
    if (!token) return showToast('Please log in first', 'error');
    try {
      const res = await fetch(`${API_URL}/playlists/${playlistId}/tracks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ trackId: currentTrack._id })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to add song to playlist');
      }
      showToast(`Added "${currentTrack.title}" to "${playlistName}"!`);
      setShowPlaylistDropdown(false);
      loadUserPlaylists();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };
  
  const progressInterval = useRef(null);

  // Sync liked state with user's likedTracks array supporting Jamendo mirrored track ObjectIds
  useEffect(() => {
    if (user && currentTrack) {
      const liked = user.likedTracks?.some(t => {
        if (!t) return false;
        const tId = typeof t === 'object' ? t._id : t;
        if (tId === currentTrack._id) return true;
        
        if (currentTrack.isJamendo && t.isJamendo) {
          const jamId1 = currentTrack._id.startsWith('jamendo-') ? currentTrack._id.replace('jamendo-', '') : (currentTrack.jamendoTrackId || '');
          const jamId2 = t._id.startsWith('jamendo-') ? t._id.replace('jamendo-', '') : (t.jamendoTrackId || '');
          if (jamId1 && jamId1 === jamId2) return true;
        }
        
        if (currentTrack._id.startsWith('jamendo-') && t.isJamendo) {
          if (currentTrack._id.replace('jamendo-', '') === t.jamendoTrackId) return true;
        }
        
        return false;
      }) || false;
      setIsLiked(liked);
    } else {
      setIsLiked(false);
    }
  }, [user, currentTrack]);

  // Track HTML5 audio element duration & elapsed time changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTimes = () => {
      setCurrentTime(audio.currentTime || 0);
      setDuration(audio.duration || currentTrack?.duration || 0);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || currentTrack?.duration || 0);
    };

    audio.addEventListener('timeupdate', updateTimes);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('durationchange', updateTimes);

    return () => {
      audio.removeEventListener('timeupdate', updateTimes);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('durationchange', updateTimes);
    };
  }, [currentTrack]);

  if (!currentTrack) return null;

  // Formatting seconds to MM:SS
  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Scrubber scrubber drag handlers
  const handleScrubChange = (e) => {
    const newPercent = parseFloat(e.target.value);
    const audio = audioRef.current;
    if (audio && duration > 0) {
      const newTime = (newPercent / 100) * duration;
      audio.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const percentComplete = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleLikeClick = async () => {
    const liked = await toggleLike(currentTrack._id);
    setIsLiked(liked);
  };

  // Cycle repeat modes
  const handleRepeatCycle = () => {
    if (repeat === 'none') setRepeat('all');
    else if (repeat === 'all') setRepeat('one');
    else setRepeat('none');
  };

  return (
    <footer className="music-player" style={{ position: 'relative' }}>
      
      {/* 0. ADVERTISEMENT OVERLAY INTERCEPTOR */}

      
      {/* 1. PLAYER LEFT: TRACK DATA */}
      <div className="player-left">
        {currentTrack.coverUrl ? (
          <img 
            className={`player-cover ${isPlaying ? 'playing' : ''}`} 
            src={currentTrack.coverUrl} 
            alt={currentTrack.title} 
            onClick={() => {
              setActiveView('song-details');
              setShowLyrics(false);
            }}
            style={{ 
              cursor: 'pointer',
              transition: 'transform var(--transition-fast)'
            }}
            title="Click to view song details"
          />
        ) : (
          <div 
            className="player-cover" 
            style={{ backgroundColor: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justify: 'center', cursor: 'pointer' }}
            onClick={() => {
              setActiveView('song-details');
              setShowLyrics(false);
            }}
            title="Click to view song details"
          >
            <Music className="w-6 h-6 text-accent" />
          </div>
        )}
        <div className="player-track-info">
          <div 
            className="player-title" 
            onClick={() => {
              setActiveView('song-details');
              setShowLyrics(false);
            }}
            style={{ cursor: 'pointer', textDecoration: 'none' }}
            onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
            onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
            title="Click to view song details"
          >
            {currentTrack.title}
          </div>
          <div 
            className="player-artist"
            onClick={() => {
              triggerProfileView(currentTrack.artist, currentTrack.isJamendo, currentTrack.jamendoArtistId || currentTrack.artist);
              setShowLyrics(false);
            }}
            style={{ cursor: 'pointer', textDecoration: 'none', color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
            onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
            title="Click to view artist profile"
          >
            {currentTrack.artistName}
          </div>
        </div>
        
        {/* Like/Heart Action */}
        {user && (
          <button 
            className="control-btn"
            style={{ marginLeft: '10px' }}
            onClick={handleLikeClick}
          >
            <Heart 
              className="w-4 h-4" 
              style={{
                color: isLiked ? 'var(--danger)' : 'var(--text-secondary)',
                fill: isLiked ? 'var(--danger)' : 'none'
              }} 
            />
          </button>
        )}

        {/* Add to Playlist Action (Spotify UX Plus Trigger) */}
        {user && (
          <div ref={dropdownRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <button 
              className="control-btn"
              style={{ marginLeft: '10px' }}
              onClick={() => setShowPlaylistDropdown(!showPlaylistDropdown)}
              title="Add to Playlist"
            >
              <Plus className="w-4 h-4" />
            </button>

            {showPlaylistDropdown && (
              <div style={{
                position: 'absolute',
                bottom: '100%',
                left: '10px',
                marginBottom: '10px',
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '6px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                zIndex: '200',
                minWidth: '180px',
                maxHeight: '220px',
                overflowY: 'auto',
                boxShadow: 'var(--glass-shadow)'
              }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '6px 8px', borderBottom: '1px solid var(--border-color)', fontWeight: 'bold' }}>
                  Add to playlist
                </div>
                {userPlaylists.length === 0 ? (
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', padding: '8px', textAlign: 'center' }}>
                    No playlists created
                  </div>
                ) : (
                  userPlaylists.map(pl => (
                    <button
                      key={pl._id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        width: '100%',
                        padding: '8px',
                        border: 'none',
                        background: 'none',
                        color: 'var(--text-primary)',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        textAlign: 'left',
                        transition: 'background var(--transition-fast)'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'none'}
                      onClick={() => handleAddToPlaylist(pl._id, pl.name)}
                    >
                      <ListPlus className="w-3.5 h-3.5" style={{ marginRight: '8px', color: 'var(--accent)' }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {pl.name}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. PLAYER CENTER: MEDIA CONTROLS & TIMELINE */}
      <div className="player-center">
        <div className="player-controls">
          <button 
            className={`control-btn ${shuffle ? 'active' : ''}`} 
            onClick={() => setShuffle(!shuffle)}
            title="Shuffle"
          >
            <Shuffle className="w-4 h-4" />
          </button>

          <button className="control-btn" onClick={prevTrack} title="Previous">
            <SkipBack className="w-5 h-5" />
          </button>

          <button className="control-btn-play" onClick={togglePlay} title={isPlaying ? 'Pause' : 'Play'}>
            {isPlaying ? <Pause /> : <Play style={{ transform: 'translateX(1.5px)' }} />}
          </button>

          <button className="control-btn" onClick={nextTrack} title="Next">
            <SkipForward className="w-5 h-5" />
          </button>

          <button 
            className={`control-btn ${repeat !== 'none' ? 'active' : ''}`} 
            onClick={handleRepeatCycle}
            title={`Repeat: ${repeat}`}
          >
            <Repeat className="w-4 h-4" />
            {repeat === 'one' && (
              <span style={{ fontSize: '8px', position: 'absolute', fontWeight: 'bold', background: 'var(--bg-primary)', color: 'var(--accent)', padding: '1px 3px', borderRadius: '50%', transform: 'translate(6px, -6px)' }}>
                1
              </span>
            )}
          </button>
        </div>

        {/* Timeline progress bar */}
        <div className="player-scrubber">
          <span>{formatTime(currentTime)}</span>
          <div className="slider-container" style={{ display: 'flex', alignItems: 'center' }}>
            <input
              type="range"
              min="0"
              max="100"
              step="0.1"
              value={percentComplete || 0}
              onChange={handleScrubChange}
              style={{
                width: '100%',
                height: '100%',
                opacity: '0',
                cursor: 'pointer',
                position: 'absolute',
                zIndex: '5',
                margin: 0
              }}
            />
            <div className="slider-progress" style={{ width: `${percentComplete}%` }}></div>
            <div className="slider-handle" style={{ left: `${percentComplete}%` }}></div>
          </div>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* 3. PLAYER RIGHT: VOLUME & VISUALIZER */}
      <div className="player-right">
        
        {/* Streaming Server Selector (TMDB/IMDB Style Multi-Server Switcher) */}
        {(() => {
          const servers = getAvailableServers(currentTrack);
          const activeServer = servers[currentServerIndex] || servers[0];
          return (
            <div style={{ position: 'relative', marginRight: '10px' }} ref={serverDropdownRef}>
              <button 
                className={`control-btn server-pill-btn ${showServerDropdown ? 'active' : ''}`}
                onClick={() => setShowServerDropdown(!showServerDropdown)}
                title="Switch Streaming Source Node (Server Alpha, Beta, Gamma, Delta)"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <Server className="w-3.5 h-3.5 text-accent" />
                <span>{activeServer ? activeServer.name.split(' ')[0] + ' ' + activeServer.name.split(' ')[1] : 'Server 1'}</span>
              </button>

              {showServerDropdown && (
                <div 
                  className="server-dropdown-modal"
                  style={{
                    position: 'absolute',
                    bottom: 'calc(100% + 12px)',
                    right: 0,
                    width: '260px',
                    background: 'rgba(18, 18, 24, 0.95)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '12px',
                    padding: '12px',
                    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5)',
                    zIndex: 100,
                    animation: 'fadeIn 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <Wifi className="w-4 h-4 text-accent" />
                    <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '0.3px' }}>
                      Streaming Server Nodes
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {servers.map((srv, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          switchStreamServer(idx);
                          setShowServerDropdown(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          background: currentServerIndex === idx ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.03)',
                          border: currentServerIndex === idx ? '1px solid var(--accent)' : '1px solid transparent',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (currentServerIndex !== idx) e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                        }}
                        onMouseLeave={(e) => {
                          if (currentServerIndex !== idx) e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span 
                            style={{
                              width: '7px',
                              height: '7px',
                              borderRadius: '50%',
                              backgroundColor: currentServerIndex === idx ? '#10B981' : '#6B7280',
                              boxShadow: currentServerIndex === idx ? '0 0 8px #10B981' : 'none'
                            }}
                          />
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>{srv.name}</div>
                            <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{srv.region} • {srv.quality}</div>
                          </div>
                        </div>
                        {currentServerIndex === idx && <Check className="w-3.5 h-3.5 text-accent" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Desktop Timed Lyrics Toggle Action */}
        <button 
          className={`control-btn ${showLyrics ? 'active' : ''}`}
          style={{ marginRight: '16px' }}
          onClick={() => setShowLyrics(!showLyrics)}
          title="Lyrics"
        >
          <Mic className="w-4 h-4" />
        </button>

        {/* Animated dynamic waveform equalizer */}
        <div className="player-visualizer">
          {[0.2, 0.5, 0.8, 0.4, 0.7, 0.3].map((delay, idx) => (
            <div
              key={idx}
              className={`visualizer-bar ${isPlaying ? 'active' : ''}`}
              style={{
                animationDelay: `${delay}s`,
                height: isPlaying ? undefined : '10%'
              }}
            ></div>
          ))}
        </div>

        {/* Speaker Volume adjust */}
        <div className="volume-box">
          <button className="control-btn" onClick={() => setMuted(!muted)} title={muted ? 'Unmute' : 'Mute'}>
            {muted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <div className="slider-container" style={{ display: 'flex', alignItems: 'center', height: '4px' }}>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={muted ? 0 : volume}
              onChange={(e) => {
                setVolume(parseFloat(e.target.value));
                setMuted(false);
              }}
              style={{
                width: '100%',
                height: '100%',
                opacity: '0',
                cursor: 'pointer',
                position: 'absolute',
                zIndex: '5',
                margin: 0
              }}
            />
            <div className="slider-progress" style={{ width: `${(muted ? 0 : volume) * 100}%` }}></div>
            <div className="slider-handle" style={{ left: `${(muted ? 0 : volume) * 100}%` }}></div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default MusicPlayer;
