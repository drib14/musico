import React, { useState, useEffect, useRef, useContext } from 'react';
import { Play, MoreVertical, Heart, Music, Plus, User, Disc, Info, CheckCircle } from 'lucide-react';
import { AppContext } from '../context/AppContext';

const TrackCard = ({ track, trackList = [] }) => {
  const { 
    playTrack, 
    triggerProfileView, 
    token, 
    userPlaylists, 
    showToast,
    API_URL,
    loadUserPlaylists,
    toggleLike,
    user,
    setActiveView,
    currentTrack,
    isPlaying
  } = useContext(AppContext);

  const [menuOpen, setMenuOpen] = useState(false);
  const [subMenuOpen, setSubMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const handleToggleMenu = (e) => {
    e.stopPropagation();
    setMenuOpen(!menuOpen);
    setSubMenuOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
        setSubMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddToPlaylist = async (e, playlistId) => {
    e.stopPropagation();
    try {
      const res = await fetch(`${API_URL}/playlists/${playlistId}/tracks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ trackId: track._id })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Added to playlist successfully!');
        loadUserPlaylists();
      } else {
        showToast(data.message || 'Error adding to playlist', 'error');
      }
    } catch (err) {
      showToast('Failed to add track', 'error');
    }
    setMenuOpen(false);
  };

  const handleLike = async (e) => {
    e.stopPropagation();
    await toggleLike(track._id);
    setMenuOpen(false);
  };

  const handleGoToArtist = (e) => {
    e.stopPropagation();
    triggerProfileView(track.artist, track.isJamendo, track.jamendoArtistId || track.artist);
    setMenuOpen(false);
  };

  const handleGoToDetails = (e) => {
    e.stopPropagation();
    // Re-route to active details view
    setActiveView('song-details');
    // Ensure track plays so details load immediately
    playTrack(track, trackList);
    setMenuOpen(false);
  };

  const isLiked = user && user.likedTracks && user.likedTracks.some(id => id === track._id);
  const isCurrentPlaying = currentTrack && currentTrack._id === track._id;

  return (
    <div 
      className={`song-card ${isCurrentPlaying ? 'active-playing' : ''}`}
      onClick={() => playTrack(track, trackList)}
      style={{ position: 'relative' }}
    >
      <div className="song-card-cover-wrapper">
        {track.coverUrl ? (
          <img className="song-card-cover" src={track.coverUrl} alt={track.title} />
        ) : (
          <div style={{ backgroundColor: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
            <Music className="w-12 h-12 text-accent" />
          </div>
        )}
        <div className="song-card-play-hover">
          <Play fill="white" className="w-6 h-6" style={{ transform: 'translateX(1px)' }} />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '4px', width: '100%', marginTop: '8px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div 
            className="song-card-title" 
            title={track.title}
            style={{ 
              color: isCurrentPlaying ? 'var(--accent)' : 'var(--text-primary)',
              fontWeight: '700',
              fontSize: '14px'
            }}
          >
            {track.title}
          </div>
          <div 
            className="song-card-artist"
            style={{ 
              textDecoration: 'underline', 
              color: 'var(--text-secondary)', 
              cursor: 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginTop: '2px'
            }}
            onClick={handleGoToArtist}
          >
            {track.artistName}
            {track.isArtistVerified && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '11px',
                height: '11px',
                borderRadius: '50%',
                backgroundColor: '#3b82f6',
                color: '#fff',
                fontSize: '7px',
                fontWeight: 'bold'
              }}>
                ✓
              </span>
            )}
          </div>
        </div>

        {/* Floating dropdown three dots */}
        <div style={{ position: 'relative' }} ref={menuRef} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={handleToggleMenu}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s',
              outline: 'none'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            title="Options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {/* Glassmorphic Dropdown Option list */}
          {menuOpen && (
            <div 
              className="spotify-context-menu"
              style={{
                position: 'absolute',
                bottom: '100%',
                right: 0,
                marginBottom: '8px',
                width: '190px',
                background: 'var(--glass-bg)',
                backdropFilter: 'var(--backdrop-blur)',
                border: '1px solid var(--glass-border)',
                borderRadius: '8px',
                padding: '6px 0',
                boxShadow: 'var(--glass-shadow)',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                animation: 'scaleIn 0.15s ease'
              }}
            >
              <button 
                onClick={() => { playTrack(track, trackList); setMenuOpen(false); }}
                className="context-menu-item"
              >
                <Play className="w-4 h-4" /> Play Song
              </button>
              
              <button 
                onClick={handleGoToArtist}
                className="context-menu-item"
              >
                <User className="w-4 h-4" /> Go to Artist
              </button>

              <button 
                onClick={handleGoToDetails}
                className="context-menu-item"
              >
                <Info className="w-4 h-4" /> Go to Song Details
              </button>

              {token && (
                <>
                  <button 
                    onClick={handleLike}
                    className="context-menu-item"
                  >
                    <Heart className="w-4 h-4" style={{ fill: isLiked ? 'var(--accent)' : 'none', color: isLiked ? 'var(--accent)' : 'inherit' }} />
                    {isLiked ? 'Unlike Song' : 'Like Song'}
                  </button>

                  {userPlaylists && userPlaylists.length > 0 && (
                    <div 
                      style={{ position: 'relative' }}
                      onMouseEnter={() => setSubMenuOpen(true)}
                      onMouseLeave={() => setSubMenuOpen(false)}
                    >
                      <button className="context-menu-item" style={{ justifyContent: 'space-between', width: '100%' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Plus className="w-4 h-4" /> Add to Playlist
                        </span>
                        <span style={{ fontSize: '9px' }}>▶</span>
                      </button>

                      {/* Floating Playlists Sub-menu */}
                      {subMenuOpen && (
                        <div 
                          className="spotify-context-submenu"
                          style={{
                            position: 'absolute',
                            left: '100%',
                            bottom: 0,
                            width: '160px',
                            background: 'var(--glass-bg)',
                            backdropFilter: 'var(--backdrop-blur)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '8px',
                            padding: '6px 0',
                            boxShadow: 'var(--glass-shadow)',
                            zIndex: 10000,
                            maxHeight: '180px',
                            overflowY: 'auto'
                          }}
                        >
                          {userPlaylists.map(pl => (
                            <button
                              key={pl._id}
                              onClick={(e) => handleAddToPlaylist(e, pl._id)}
                              className="context-menu-item"
                              style={{ padding: '8px 12px', fontSize: '12px' }}
                            >
                              <Disc className="w-3.5 h-3.5" /> {pl.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', fontSize: '11px', color: 'var(--text-muted)' }}>
        <span className="song-card-genre" style={{ margin: 0 }}>{track.genre}</span>
        <span>{track.plays ? `${track.plays.toLocaleString()} plays` : '0 plays'}</span>
      </div>
    </div>
  );
};

export default TrackCard;
