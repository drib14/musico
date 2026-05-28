import React, { useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { Music, Calendar, Star, Send, Crown, CheckCircle, Plus, X, Globe, Facebook, Twitter, Instagram } from 'lucide-react';

const RightSidebar = () => {
  const { 
    API_URL, 
    currentTrack, 
    setCurrentTrack,
    isPlaying, 
    audioRef, 
    user, 
    token, 
    showToast,
    triggerProfileView,
    setActiveView,
    showLyrics,
    setShowLyrics
  } = useContext(AppContext);

  const [artistInfo, setArtistInfo] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [newLyrics, setNewLyrics] = useState('');
  const [submittingLyrics, setSubmittingLyrics] = useState(false);
  const [showLyricsForm, setShowLyricsForm] = useState(false);
  const [savingTrack, setSavingTrack] = useState(false);
  const activeLineRef = useRef(null);
  const navigate = useNavigate();

  const stripHtml = (html) => {
    if (!html) return '';
    return html.replace(/<\/?[^>]+(>|$)/g, "");
  };

  const handleSaveToDb = async (e) => {
    e.stopPropagation();
    if (!token) {
      showToast('Please log in to save tracks to the database!', 'error');
      return;
    }
    setSavingTrack(true);
    try {
      const res = await fetch(`${API_URL}/tracks/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ trackId: currentTrack._id })
      });
      if (res.ok) {
        const data = await res.json();
        showToast('Track imported to Musico DB successfully!');
        setCurrentTrack({ ...currentTrack, isJamendo: false, _id: data.track._id });
      } else {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to save track');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingTrack(false);
    }
  };

  // Dynamic listener stats loading
  useEffect(() => {
    if (currentTrack?.artist) {
      fetchArtistDetails();
    }
  }, [currentTrack]);

  const fetchArtistDetails = async () => {
    try {
      const artistId = currentTrack.isJamendo 
        ? (currentTrack.jamendoArtistId || currentTrack.artist)
        : currentTrack.artist;

      const url = currentTrack.isJamendo
        ? `${API_URL}/tracks/jamendo/artist/${artistId}`
        : `${API_URL}/auth/users/${artistId}`;
        
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setArtistInfo(data.user);
      }
    } catch (err) {
      console.error('Error loading right sidebar stats:', err);
    }
  };

  // Sync playback elapsed time via requestAnimationFrame for smoother updates
  useEffect(() => {
    const audio = audioRef?.current;
    if (!audio) return;

    let animationFrameId;
    const updateTime = () => {
      setCurrentTime(audio.currentTime || 0);
      animationFrameId = requestAnimationFrame(updateTime);
    };

    const handlePlay = () => {
      animationFrameId = requestAnimationFrame(updateTime);
    };

    const handlePause = () => {
      cancelAnimationFrame(animationFrameId);
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    if (!audio.paused) {
      handlePlay();
    } else {
      setCurrentTime(audio.currentTime || 0);
    }

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      cancelAnimationFrame(animationFrameId);
    };
  }, [audioRef, currentTrack]);

  if (!currentTrack) return null;

  const isUploader = user && user._id === currentTrack.artist;
  const hasLyrics = currentTrack.lyrics && currentTrack.lyrics.trim().length > 0;

  // Immersive timed parser & auto-interpolator
  const parseLyrics = () => {
    if (!hasLyrics) return [];

    const lines = currentTrack.lyrics.split('\n');
    const parsed = [];
    let hasAnyTimestamps = false;

    // Pattern matching [m:ss], [mm:ss], [m:ss.xx], [mm:ss.xxx]
    const timeRegex = /\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]/;

    lines.forEach((line) => {
      const match = timeRegex.exec(line);
      if (match) {
        hasAnyTimestamps = true;
        const mins = parseInt(match[1], 10);
        const secs = parseInt(match[2], 10);
        const msStr = match[3] || '0';
        const msVal = parseInt(msStr, 10);
        
        const timeInSecs = mins * 60 + secs + (msVal / Math.pow(10, msStr.length));
        const text = line.replace(timeRegex, '').trim();
        parsed.push({ time: timeInSecs, text });
      } else {
        parsed.push({ time: null, text: line.trim() });
      }
    });

    // Fallback: If no timestamps exist, distribute lines evenly across duration
    if (!hasAnyTimestamps) {
      const trackDuration = currentTrack.duration || 30; // default 30s spotify previews
      const validLines = parsed.filter(p => p.text.length > 0);
      const totalValid = validLines.length;

      let lineIndex = 0;
      const distributed = parsed.map((p) => {
        if (p.text.length === 0) {
          return { time: 0, text: '' };
        }
        const time = totalValid > 1 
          ? 1.5 + (lineIndex / (totalValid - 1)) * (trackDuration - 3.5)
          : 0;
        lineIndex++;
        return { time, text: p.text };
      });
      return distributed;
    }

    // Interpolate missing timestamps sequentially
    let lastTime = 0;
    for (let i = 0; i < parsed.length; i++) {
      if (parsed[i].time === null) {
        parsed[i].time = lastTime + 1.5;
      } else {
        lastTime = parsed[i].time;
      }
    }

    // Sort chronologically
    parsed.sort((a, b) => a.time - b.time);

    // Delta gap checks to inject rotating musical note solo row
    const parsedWithInstrumentals = [];
    for (let i = 0; i < parsed.length; i++) {
      parsedWithInstrumentals.push(parsed[i]);
      if (i < parsed.length - 1) {
        const currentLine = parsed[i];
        const nextLine = parsed[i + 1];
        if (currentLine.time !== null && nextLine.time !== null && currentLine.text.length > 0 && nextLine.text.length > 0) {
          const gap = nextLine.time - currentLine.time;
          if (gap > 8) {
            parsedWithInstrumentals.push({
              time: currentLine.time + 2,
              text: '🎸 Instrumental Solo 🎸',
              isInstrumental: true
            });
          }
        }
      }
    }

    return parsedWithInstrumentals;
  };

  const parsedLines = parseLyrics();

  // Find active line index based on playback time (exact vocal synchronization matching Spotify)
  let activeIndex = -1;
  for (let i = 0; i < parsedLines.length; i++) {
    if (parsedLines[i].time !== null && currentTime >= parsedLines[i].time) {
      activeIndex = i;
    }
  }

  // Smooth auto-scroll the active line to the center
  useEffect(() => {
    if (activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [activeIndex]);

  const handleLineClick = (time) => {
    if (time === null) return;
    const audio = audioRef?.current;
    if (audio) {
      audio.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Submit/Add Lyrics Handler
  const handleSaveLyrics = async (e) => {
    e.preventDefault();
    if (!newLyrics.trim()) return showToast('Please enter some lyrics first', 'error');

    setSubmittingLyrics(true);
    try {
      const res = await fetch(`${API_URL}/tracks/${currentTrack._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ lyrics: newLyrics.trim() })
      });

      if (!res.ok) throw new Error('Failed to update lyrics');
      
      showToast('Lyrics updated successfully!');
      setCurrentTrack({ ...currentTrack, lyrics: newLyrics.trim() });
      setNewLyrics('');
      setShowLyricsForm(false);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmittingLyrics(false);
    }
  };

  // Hide the entire lyrics section if empty and not uploader
  const shouldShowLyricsContainer = hasLyrics || isUploader;

  return (
    <aside className="right-sidebar" style={{
      width: '350px',
      backgroundColor: 'var(--bg-secondary)',
      borderLeft: '1px solid var(--border-color)',
      padding: '24px 20px 80px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      overflowY: 'auto',
      height: '100%',
      maxHeight: 'calc(100vh - var(--player-height) - 16px)',
      zIndex: '10',
      transition: 'background-color var(--transition-normal)'
    }}>
      
      {/* 1. SONG DETAILS CARD */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <h3 style={{ fontSize: '15px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold', margin: 0 }}>
          Now Playing
        </h3>
        
        {/* Cover Art clickable redirect to Song Details view */}
        <div 
          onClick={() => setActiveView('song-details')}
          style={{
            width: '100%',
            aspectRatio: '1',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
            position: 'relative',
            cursor: 'pointer'
          }}
        >
          {currentTrack.coverUrl ? (
            <img src={currentTrack.coverUrl} alt={currentTrack.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', backgroundColor: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Music className="w-16 h-16 text-accent" />
            </div>
          )}
        </div>

        <div>
          {/* Song title clickable redirect to Song Details view */}
          <h2 
            onClick={() => setActiveView('song-details')}
            style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', margin: 0, fontFamily: 'Outfit', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {currentTrack.title}
          </h2>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
            {/* Artist name clickable redirect to Artist Profile view */}
            <span 
              onClick={() => triggerProfileView(currentTrack.artist, currentTrack.isJamendo, currentTrack.artist)}
              style={{ fontSize: '14px', color: 'var(--text-secondary)', cursor: 'pointer', textDecoration: 'underline' }}
            >
              {currentTrack.artistName}
            </span>
            {artistInfo?.isArtistVerified && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                backgroundColor: '#3b82f6',
                color: '#fff',
                fontSize: '8px',
                fontWeight: 'bold'
              }}>
                ✓
              </span>
            )}
            {artistInfo?.isPremium && (
              <span className="user-badge" style={{ fontSize: '9px', padding: '1px 5px', margin: 0 }}>
                <Crown style={{ width: '8px', height: '8px' }} />
                Premium
              </span>
            )}
          </div>
          <div style={{
            fontSize: '11px',
            backgroundColor: 'var(--accent-light)',
            color: 'var(--accent)',
            padding: '2px 8px',
            borderRadius: '99px',
            width: 'fit-content',
            marginTop: '8px',
            fontWeight: '600'
          }}>
            {currentTrack.genre || 'Unknown'}
          </div>

        </div>
      </section>

      <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '4px 0' }} />

      {/* 2. DYNAMIC ARTIST DETAILS */}
      {artistInfo && (
        <section style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px',
          backgroundColor: 'var(--bg-tertiary)',
          border: '1px solid var(--border-color)',
          borderRadius: '14px',
          padding: '16px',
          boxShadow: 'var(--glass-shadow)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <h3 style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '800', margin: '0 0 4px 0' }}>
            About The Artist
          </h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {artistInfo.artistAvatar || artistInfo.userAvatar ? (
              <img
                src={artistInfo.artistAvatar || artistInfo.userAvatar}
                alt={artistInfo.artistName || artistInfo.name}
                style={{ 
                  width: '54px', 
                  height: '54px', 
                  borderRadius: '50%', 
                  objectFit: 'cover',
                  border: '2px solid var(--accent)',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                }}
              />
            ) : (
              <div style={{ 
                width: '54px', 
                height: '54px', 
                borderRadius: '50%', 
                backgroundColor: 'var(--accent-gradient)', 
                color: '#fff', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontWeight: 'bold', 
                fontSize: '20px',
                boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
              }}>
                {(artistInfo.artistName || artistInfo.name).charAt(0).toUpperCase()}
              </div>
            )}
            
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span 
                  onClick={() => triggerProfileView(currentTrack.artist, currentTrack.isJamendo, currentTrack.artist)}
                  style={{ 
                    fontSize: '14px', 
                    fontWeight: '800', 
                    color: 'var(--text-primary)', 
                    cursor: 'pointer',
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis', 
                    whiteSpace: 'nowrap'
                  }}
                >
                  {artistInfo.artistName || artistInfo.name}
                </span>
                {artistInfo.isArtistVerified && (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '13px',
                    height: '13px',
                    borderRadius: '50%',
                    backgroundColor: '#3b82f6',
                    color: '#fff',
                    fontSize: '8px',
                    fontWeight: 'bold'
                  }} title="Verified Artist">
                    ✓
                  </span>
                )}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {artistInfo.followers ? `${artistInfo.followers.length.toLocaleString()} followers` : '0 followers'}
              </div>
            </div>
          </div>

          {artistInfo.artistBio && (
            <p style={{ 
              fontSize: '12px', 
              color: 'var(--text-secondary)', 
              lineHeight: '1.5',
              margin: '8px 0 4px 0',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {stripHtml(artistInfo.artistBio)}
            </p>
          )}

          <button
            onClick={() => triggerProfileView(currentTrack.artist, currentTrack.isJamendo, currentTrack.artist)}
            className="btn btn-primary"
            style={{
              padding: '8px 14px',
              fontSize: '12.5px',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              width: '100%',
              cursor: 'pointer',
              fontWeight: 'bold',
              marginTop: '4px',
              background: 'var(--accent-gradient)'
            }}
          >
            Go to artist profile
          </button>
        </section>
      )}

      {shouldShowLyricsContainer && (
        <>
          <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '4px 0' }} />

          {/* 3. TIMED LYRICS SECTION */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, minHeight: 0 }}>
            {/* Clickable Header redirect to Fullscreen LyricsView */}
            <h3 
              onClick={() => navigate('/pages/lyrics')}
              style={{ 
                fontSize: '15px', 
                color: 'var(--text-secondary)', 
                textTransform: 'uppercase', 
                letterSpacing: '1px', 
                fontWeight: 'bold', 
                margin: 0,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              Lyrics <span style={{ fontSize: '11px', textTransform: 'lowercase', color: 'var(--accent)', fontWeight: 'bold' }}>(expand fullscreen)</span>
            </h3>
            
            {hasLyrics ? (
              <div 
                style={{
                  backgroundColor: '#121212',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  padding: '20px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  maxHeight: '260px',
                  overflowY: 'auto',
                  scrollBehavior: 'smooth'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {parsedLines.map((line, idx) => {
                    const isActive = idx === activeIndex;
                    const isPast = idx < activeIndex;
                    const isInstrumental = line.isInstrumental || /instrumental|solo|guitar solo|synth solo|music solo/i.test(line.text);
                    
                    return (
                      <p
                        key={idx}
                        ref={isActive ? activeLineRef : null}
                        onClick={() => handleLineClick(line.time)}
                        className={`sidebar-lyric-line ${isActive ? 'active' : (isPast ? 'past' : 'future')} ${isInstrumental ? 'instrumental-solo' : ''}`}
                        style={{
                          fontSize: '15px',
                          fontWeight: '700',
                          lineHeight: '1.4',
                          cursor: 'pointer',
                          margin: 0,
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {isInstrumental ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            {isActive && <span className="spinning-music-note">🎵</span>}
                            🎵 Instrumental 🎵
                          </span>
                        ) : (
                          line.text.length === 0 ? '\u00A0' : line.text
                        )}
                      </p>
                    );
                  })}
                </div>
              </div>
            ) : (
              // Uploader Lyrics Addition Block
              isUploader && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {!showLyricsForm ? (
                    <div style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      border: '1px dashed var(--border-color)',
                      borderRadius: '14px',
                      padding: '24px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px',
                      textAlign: 'center'
                    }}>
                      <Music className="w-8 h-8 text-muted" style={{ opacity: 0.6 }} />
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        No lyrics have been added to this song yet.
                      </div>
                      <button
                        onClick={() => setShowLyricsForm(true)}
                        className="btn btn-primary"
                        style={{
                          padding: '8px 16px',
                          fontSize: '13px',
                          borderRadius: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          marginTop: '4px'
                        }}
                      >
                        <Plus style={{ width: '14px', height: '14px' }} />
                        <span>Add Lyrics</span>
                      </button>
                    </div>
                  ) : (
                    <div style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '14px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      boxShadow: 'var(--glass-shadow)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                          Add Song Lyrics
                        </div>
                        <button 
                          onClick={() => setShowLyricsForm(false)} 
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title="Cancel"
                        >
                          <X style={{ width: '16px', height: '16px' }} />
                        </button>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                        💡 Timed formatting: Use <code>[mm:ss] Lyrics text</code> to enable tap-to-scrub scrolling highlights.
                      </div>
                      <form onSubmit={handleSaveLyrics} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <textarea
                          placeholder="e.g.&#10;[00:04] First lyrics sentence&#10;[00:15] Timed second lyric sentence..."
                          rows="5"
                          value={newLyrics}
                          onChange={(e) => setNewLyrics(e.target.value)}
                          style={{
                            width: '100%',
                            backgroundColor: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            padding: '10px',
                            fontSize: '13px',
                            fontFamily: 'inherit',
                            resize: 'vertical',
                            outline: 'none'
                          }}
                          required
                        />
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => setShowLyricsForm(false)}
                            className="btn btn-secondary"
                            style={{ flex: 1, padding: '8px 16px', height: '36px', fontSize: '13px' }}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ flex: 2, padding: '8px 16px', display: 'flex', gap: '6px', height: '36px', fontSize: '13px', justifyContent: 'center' }}
                            disabled={submittingLyrics}
                          >
                            {submittingLyrics ? (
                              <>
                                <div className="spinner" style={{ width: '14px', height: '14px' }}></div>
                                Saving...
                              </>
                            ) : (
                              <>
                                <span>Save Lyrics</span>
                                <Send className="w-3.5 h-3.5" />
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              )
            )}
          </section>
        </>
      )}

    </aside>
  );
};

export default RightSidebar;
