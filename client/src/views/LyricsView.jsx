import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { X, Crown, Music, AlertCircle } from 'lucide-react';

const LyricsView = () => {
  const { currentTrack, user, setShowLyrics, setActiveView } = useContext(AppContext);

  if (!currentTrack) return null;

  const isPremium = user?.isPremium || false;
  const hasLyrics = currentTrack.lyrics && currentTrack.lyrics.trim().length > 0;
  
  // Split the lyrics by lines
  const lyricsLines = hasLyrics ? currentTrack.lyrics.split('\n') : [];

  const handleUpgradeClick = () => {
    setShowLyrics(false);
    setActiveView('billing');
  };

  return (
    <div className="lyrics-view-overlay">
      {/* Dynamic colorful glowing orb in background */}
      <div className="lyrics-glow-orb"></div>
      
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
            {isPremium ? (
              // Premium View: Full scrollable lyrics
              lyricsLines.map((line, idx) => (
                <p key={idx} className="lyrics-text-line">
                  {line.trim().length === 0 ? '\u00A0' : line}
                </p>
              ))
            ) : (
              // Free View: Limited preview of first 3 lines
              <>
                {lyricsLines.slice(0, 3).map((line, idx) => (
                  <p key={idx} className="lyrics-text-line">
                    {line.trim().length === 0 ? '\u00A0' : line}
                  </p>
                ))}
                
                {/* Visual Blurred Fading Effect */}
                <div className="lyrics-blur-fade">
                  <p className="lyrics-text-line blurred-line">Lyrics are locked...</p>
                  <p className="lyrics-text-line blurred-line" style={{ filter: 'blur(8px)' }}>Hidden content...</p>
                </div>

                {/* Premium Gate Card */}
                <div className="lyrics-premium-gate-card">
                  <div className="gate-icon-wrapper">
                    <Crown className="w-8 h-8 text-premium-color" />
                  </div>
                  <h3 className="gate-title">Enjoying the Lyrics?</h3>
                  <p className="gate-desc">
                    Upgrade to <span style={{ color: 'var(--premium-color)', fontWeight: '600' }}>Musico Premium</span> to sing along with full timed lyrics, unlock unlimited high-quality audio uploads, and enjoy complete ad-free streaming.
                  </p>
                  <button 
                    className="btn btn-primary gate-cta-btn"
                    onClick={handleUpgradeClick}
                  >
                    Upgrade to Premium
                  </button>
                </div>
              </>
            )}
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
