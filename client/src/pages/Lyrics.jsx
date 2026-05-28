import React, { useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { X, Crown, Music, AlertCircle } from 'lucide-react';

const Lyrics = () => {
  const { currentTrack, user, setShowLyrics, setActiveView, audioRef } = useContext(AppContext);
  const [currentTime, setCurrentTime] = useState(0);
  const activeLineRef = useRef(null);
  const navigate = useNavigate();

  // Synchronize playback time with HTML5 audio via timeupdate event listener for highly reliable precision sync
  useEffect(() => {
    const audio = audioRef?.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    
    // Initial sync
    setCurrentTime(audio.currentTime || 0);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [audioRef, currentTrack]);

  if (!currentTrack) return null;

  const isPremium = true; // All users have premium features for free!
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
      const trackDuration = audioRef?.current?.duration || currentTrack.duration || 180;
      const totalLines = parsed.length;

      const distributed = parsed.map((p, idx) => {
        const time = totalLines > 1 
          ? 1.0 + (idx / (totalLines - 1)) * (trackDuration - 3.0)
          : 0;
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

  // Restrict lines if Free tier user (Bypassed since premium is free!)
  const visibleLines = isPremium ? parsedLines : parsedLines.slice(0, 3);

  return (
    <div className="lyrics-view-overlay">
      {/* Immersive blurred cover art background overlay (Musixmatch / Spotify UX) */}
      {currentTrack.coverUrl && (
        <div 
          className="lyrics-artwork-bg"
          style={{ 
            backgroundImage: `url(${currentTrack.coverUrl})`,
            position: 'absolute',
            inset: 0,
            filter: 'blur(70px) brightness(0.25)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            zIndex: 0,
            opacity: 0.75,
            transition: 'background-image 0.5s ease-in-out',
            pointerEvents: 'none'
          }}
        />
      )}
      
      {/* Dynamic colorful glowing orb in background */}
      <div className="lyrics-glow-orb" style={{ zIndex: 1 }}></div>
      
      {/* Top Header Row */}
      <div className="lyrics-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
          {currentTrack.coverUrl ? (
            <img className="lyrics-track-cover" src={currentTrack.coverUrl} alt={currentTrack.title} />
          ) : (
            <div className="lyrics-track-cover-fallback">
              <Music className="w-5 h-5 text-accent" />
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <div className="lyrics-track-title">{currentTrack.title}</div>
            <div className="lyrics-track-artist">{currentTrack.artistName}</div>
          </div>
        </div>
        
        <button 
          className="lyrics-close-btn"
          onClick={() => {
            setShowLyrics(false);
          }}
          title="Close Lyrics"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Lyrics Body Content */}
      <div className="lyrics-body-container">
        {hasLyrics ? (
          <div className="lyrics-lines-wrapper">
            {visibleLines.map((line, idx) => {
              const isActive = idx === activeIndex;
              const isPast = idx < activeIndex;
              const isInstrumental = line.isInstrumental || /instrumental|solo|guitar solo|synth solo|music solo/i.test(line.text);
              return (
                <p 
                  key={idx} 
                  ref={isActive ? activeLineRef : null}
                  className={`lyrics-text-line ${isActive ? 'active' : (isPast ? 'past' : 'future')} ${isInstrumental ? 'instrumental-solo' : ''}`}
                  onClick={() => handleLineClick(line.time)}
                  style={isInstrumental ? {
                    color: isActive ? 'var(--premium-color)' : 'var(--text-muted)',
                    fontStyle: 'italic',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px'
                  } : {}}
                >
                  {isInstrumental ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '24px' }}>
                      {isActive && <span className="spinning-music-note">🎵</span>}
                      🎵
                    </span>
                  ) : (
                    line.text.length === 0 ? '\u00A0' : line.text
                  )}
                </p>
              );
            })}
          </div>
        ) : (
          // Fallback Placeholder if no lyrics are uploaded
          <div className="lyrics-empty-placeholder">
            <AlertCircle className="w-12 h-12 text-muted" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>No Lyrics Available</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '440px', lineHeight: '1.6', margin: '0 auto 24px auto' }}>
              Lyrics haven't been provided for this track yet. 
              {user?._id === currentTrack.artist ? (
                <span style={{ display: 'block', marginTop: '10px', color: 'var(--accent)' }}>
                  As the artist, you can add lyrics in the panel on the right sidebar!
                </span>
              ) : (
                " The artist hasn't uploaded them yet."
              )}
            </p>
            <button 
              className="btn btn-secondary"
              onClick={() => setShowLyrics(false)}
            >
              Back to Player
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Lyrics;

