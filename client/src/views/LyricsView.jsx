import React, { useContext, useState, useEffect, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { X, Crown, Music, AlertCircle } from 'lucide-react';

const LyricsView = () => {
  const { currentTrack, user, setShowLyrics, setActiveView, audioRef } = useContext(AppContext);
  const [currentTime, setCurrentTime] = useState(0);
  const activeLineRef = useRef(null);

  // Synchronize playback time with HTML5 audio
  useEffect(() => {
    const audio = audioRef?.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    // Grab initial value in case already playing
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
      return parsed.map((p) => {
        if (p.text.length === 0) {
          return { time: 0, text: '' };
        }
        const time = totalValid > 1 
          ? 1.5 + (lineIndex / (totalValid - 1)) * (trackDuration - 3.5)
          : 0;
        lineIndex++;
        return { time, text: p.text };
      });
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

    return parsed;
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

  const handleUpgradeClick = () => {
    setShowLyrics(false);
    setActiveView('billing');
  };

  // Restrict lines if Free tier user
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
          onClick={() => setShowLyrics(false)}
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
              return (
                <p 
                  key={idx} 
                  ref={isActive ? activeLineRef : null}
                  className={`lyrics-text-line ${isActive ? 'active' : ''}`}
                  onClick={() => handleLineClick(line.time)}
                >
                  {line.text.length === 0 ? '\u00A0' : line.text}
                </p>
              );
            })}
            
            {/* Gated blocks removed */}
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
                  As the artist, you can delete this track and upload a fresh version with full lyrics in the Upload section!
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

export default LyricsView;
