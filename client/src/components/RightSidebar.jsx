import React, { useContext, useState, useEffect, useRef } from 'react';
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

  // Sync playback elapsed time
  useEffect(() => {
    const audio = audioRef?.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    setCurrentTime(audio.currentTime || 0);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
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

    // Pattern matching [mm:ss] or [mm:ss.xx]
    const timeRegex = /\[(\d{2}):(\d{2})(?:[.:](\d{2,3}))?\]/;

    lines.forEach((line) => {
      const match = timeRegex.exec(line);
      if (match) {
        hasAnyTimestamps = true;
        const mins = parseInt(match[1], 10);
        const secs = parseInt(match[2], 10);
        const ms = match[3] ? parseInt(match[3], 10) : 0;
        
        const timeInSecs = mins * 60 + secs + (ms >= 100 ? ms / 1000 : ms / 100);
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

  // Find active line index based on playback time
  let activeIndex = -1;
  for (let i = 0; i < parsedLines.length; i++) {
    if (parsedLines[i].text.length > 0 && currentTime >= parsedLines[i].time) {
      activeIndex = i;
    } else if (parsedLines[i].text.length > 0 && currentTime < parsedLines[i].time) {
      break;
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
          {currentTrack.isJamendo && (
            <button
              onClick={handleSaveToDb}
              disabled={savingTrack}
              style={{
                marginTop: '8px',
                padding: '6px 12px',
                fontSize: '11px',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                fontWeight: 'bold',
                width: 'fit-content'
              }}
            >
              {savingTrack ? (
                <>
                  <div className="spinner" style={{ width: '10px', height: '10px' }}></div>
                  Saving...
                </>
              ) : (
                <>
                  <Plus style={{ width: '12px', height: '12px' }} />
                  Save to DB
                </>
              )}
            </button>
          )}
        </div>
      </section>

      <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '4px 0' }} />

      {/* 2. DYNAMIC ARTIST DETAILS */}
      {artistInfo && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '15px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold', margin: 0 }}>
            About the Artist
          </h3>
          
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
            {/* Clickable redirect to Artist Profile */}
            <div 
              style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
              onClick={() => triggerProfileView(currentTrack.artist, currentTrack.isJamendo, currentTrack.artist)}
            >
              {artistInfo.artistAvatar || artistInfo.userAvatar ? (
                <img 
                  src={artistInfo.artistAvatar || artistInfo.userAvatar} 
                  alt={artistInfo.artistName || artistInfo.name} 
                  style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid var(--accent)' }} 
                />
              ) : (
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--accent-gradient)', color: '#fff', display: 'flex', alignItems: 'center', justify: 'center', fontWeight: 'bold', fontSize: '18px' }}>
                  {(artistInfo.artistName || artistInfo.name).charAt(0).toUpperCase()}
                </div>
              )}
              
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                  {artistInfo.artistName || artistInfo.name}
                </h4>
                <div style={{ display: 'flex', gap: '10px', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  <span><strong>{artistInfo.monthlyListeners?.toLocaleString() || 0}</strong> Listeners</span>
                  <span>•</span>
                  <span><strong>{artistInfo.totalPlays?.toLocaleString() || 0}</strong> Streams</span>
                </div>
              </div>
            </div>

            {artistInfo.artistBio && (
              <p style={{
                fontSize: '12.5px',
                color: 'var(--text-secondary)',
                lineHeight: '1.5',
                margin: 0,
                whiteSpace: 'pre-wrap'
              }}
              >
                {stripHtml(artistInfo.artistBio)}
              </p>
            )}

            {(artistInfo.facebook || artistInfo.twitter || artistInfo.instagram || artistInfo.website) && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px', alignItems: 'center' }}>
                {artistInfo.website && (
                  <a href={artistInfo.website} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justify: 'center', width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} title="Website">
                    <Globe style={{ width: '14px', height: '14px' }} />
                  </a>
                )}
                {artistInfo.facebook && (
                  <a href={artistInfo.facebook.startsWith('http') ? artistInfo.facebook : `https://facebook.com/${artistInfo.facebook}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justify: 'center', width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} title="Facebook">
                    <Facebook style={{ width: '14px', height: '14px' }} />
                  </a>
                )}
                {artistInfo.twitter && (
                  <a href={artistInfo.twitter.startsWith('http') ? artistInfo.twitter : `https://twitter.com/${artistInfo.twitter}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justify: 'center', width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} title="Twitter">
                    <Twitter style={{ width: '14px', height: '14px' }} />
                  </a>
                )}
                {artistInfo.instagram && (
                  <a href={artistInfo.instagram.startsWith('http') ? artistInfo.instagram : `https://instagram.com/${artistInfo.instagram}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justify: 'center', width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} title="Instagram">
                    <Instagram style={{ width: '14px', height: '14px' }} />
                  </a>
                )}
              </div>
            )}

            {artistInfo.concerts && artistInfo.concerts.length > 0 && (
              <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                <h5 style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar style={{ width: '13px', height: '13px' }} />
                  Upcoming Concerts
                </h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {artistInfo.concerts.map((c, idx) => (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '2px', backgroundColor: 'var(--bg-secondary)', padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--accent)' }}>{c.date}</span>
                      <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{c.title}</span>
                      <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{c.venue} • {c.city}</span>
                      {c.url && (
                        <a 
                          href={c.url}
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{
                            marginTop: '6px',
                            fontSize: '11px',
                            color: 'var(--accent)',
                            textDecoration: 'underline',
                            fontWeight: 'bold',
                            display: 'inline-block'
                          }}
                        >
                          Get Tickets
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {shouldShowLyricsContainer && (
        <>
          <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '4px 0' }} />

          {/* 3. TIMED LYRICS SECTION */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, minHeight: 0 }}>
            {/* Clickable Header redirect to Fullscreen LyricsView */}
            <h3 
              onClick={() => setShowLyrics(true)}
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
                  backgroundColor: 'var(--bg-tertiary)',
                  borderRadius: '14px',
                  border: '1px solid var(--border-color)',
                  padding: '16px'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {(() => {
                    const displayLinesCount = 3;
                    const startIndex = activeIndex === -1 ? 0 : Math.max(0, activeIndex);
                    const endIndex = Math.min(parsedLines.length, startIndex + displayLinesCount);
                    const slicedLines = parsedLines.slice(startIndex, endIndex);

                    return slicedLines.map((line, slicedIdx) => {
                      const absoluteIdx = startIndex + slicedIdx;
                      const isActive = absoluteIdx === activeIndex;
                      const isPast = absoluteIdx < activeIndex;
                      const isInstrumental = line.isInstrumental || /instrumental|solo|guitar solo|synth solo|music solo/i.test(line.text);
                      
                      return (
                        <p
                          key={absoluteIdx}
                          ref={isActive ? activeLineRef : null}
                          onClick={() => handleLineClick(line.time)}
                          className={`sidebar-lyric-line ${isActive ? 'active' : (isPast ? 'past' : 'future')} ${isInstrumental ? 'instrumental-solo' : ''}`}
                        >
                          {isInstrumental ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '18px' }}>
                              {isActive && <span className="spinning-music-note">🎵</span>}
                              🎵
                            </span>
                          ) : (
                            line.text.length === 0 ? '\u00A0' : line.text
                          )}
                        </p>
                      );
                    });
                  })()}
                </div>
                {parsedLines.length > 3 && (
                  <button
                    onClick={() => setShowLyrics(true)}
                    className="btn btn-secondary"
                    style={{
                      marginTop: '12px',
                      padding: '8px 12px',
                      fontSize: '12px',
                      borderRadius: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      width: '100%',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    Show Full Lyrics (expand)
                  </button>
                )}
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
