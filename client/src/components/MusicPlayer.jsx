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
  Music
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
    setActiveView
  } = useContext(AppContext);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  
  const progressInterval = useRef(null);

  // Sync liked state with user's likedTracks array
  useEffect(() => {
    if (user && currentTrack) {
      setIsLiked(user.likedTracks.includes(currentTrack._id));
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
      {adActive && (
        <div className="player-ad-overlay" style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(7, 10, 19, 0.95)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          zIndex: 100,
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          animation: 'slideUp 0.3s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #ff416c, #ff4b2b)',
              color: '#fff',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>ADVERTISEMENT</div>
            <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '13px', fontWeight: '500' }}>
              Support Musico by listening to this short ad. Premium gets you uninterrupted streaming!
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ color: 'var(--accent)', fontWeight: '600', fontSize: '13px' }}>
              Resuming in {adCountdown}s...
            </span>
            <button 
              onClick={() => setActiveView('billing')} 
              style={{
                background: 'var(--accent)',
                color: '#070a13',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '20px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '11px',
                transition: 'all 0.2s'
              }}
            >
              Go Premium
            </button>
          </div>
        </div>
      )}
      
      {/* 1. PLAYER LEFT: TRACK DATA */}
      <div className="player-left">
        {currentTrack.coverUrl ? (
          <img 
            className={`player-cover ${isPlaying ? 'playing' : ''}`} 
            src={currentTrack.coverUrl} 
            alt={currentTrack.title} 
          />
        ) : (
          <div className="player-cover" style={{ backgroundColor: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justify: 'center' }}>
            <Music className="w-6 h-6 text-accent" />
          </div>
        )}
        <div className="player-track-info">
          <div className="player-title">{currentTrack.title}</div>
          <div className="player-artist">{currentTrack.artistName}</div>
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
