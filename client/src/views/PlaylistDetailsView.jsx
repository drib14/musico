import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { Play, Music, Trash2, ArrowLeft, FolderHeart } from 'lucide-react';

const PlaylistDetailsView = () => {
  const { 
    API_URL, 
    token, 
    activePlaylistId, 
    setActiveView, 
    playTrack, 
    currentTrack, 
    isPlaying, 
    showToast,
    loadUserPlaylists,
    triggerProfileView
  } = useContext(AppContext);

  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activePlaylistId) {
      fetchPlaylistDetails();
    }
  }, [activePlaylistId]);

  const fetchPlaylistDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/playlists/${activePlaylistId}`);
      if (!res.ok) throw new Error('Failed to load playlist details');
      const data = await res.json();
      setPlaylist(data);
    } catch (err) {
      console.error(err);
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayPlaylist = () => {
    if (!playlist || playlist.tracks.length === 0) {
      showToast('This playlist is empty!', 'error');
      return;
    }
    // Play first track and queue all tracks
    playTrack(playlist.tracks[0], playlist.tracks);
  };

  const handleRemoveTrack = async (trackId, e) => {
    e.stopPropagation();
    if (!window.confirm('Remove this track from the playlist?')) return;

    try {
      const res = await fetch(`${API_URL}/playlists/${activePlaylistId}/tracks/${trackId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to remove track');
      showToast('Track removed from playlist');
      
      // Reload playlists and list
      fetchPlaylistDetails();
      loadUserPlaylists();
    } catch (err) {
      console.error(err);
      showToast(err.message, 'error');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '100px' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <h3 className="text-danger">Playlist not found</h3>
        <button className="btn btn-secondary" onClick={() => setActiveView('library')}>
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Back action */}
      <div>
        <button 
          onClick={() => setActiveView('library')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px',
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.color = 'var(--text-primary)'}
          onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Library
        </button>
      </div>

      {/* Playlist Header Card */}
      <div style={{
        display: 'flex',
        gap: '24px',
        background: 'linear-gradient(to bottom, rgba(0, 242, 254, 0.05), rgba(7, 10, 19, 0))',
        padding: '24px',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.03)',
        alignItems: 'flex-end',
        flexWrap: 'wrap'
      }}>
        <div style={{
          width: '192px',
          height: '192px',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          flexShrink: 0
        }}>
          {playlist.coverUrl ? (
            <img src={playlist.coverUrl} alt={playlist.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              backgroundColor: 'var(--bg-tertiary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Music className="w-16 h-16 text-accent" />
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--accent)', letterSpacing: '1.5px' }}>
            PLAYLIST
          </span>
          <h1 style={{ fontSize: '36px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', lineHeight: '1.1' }}>
            {playlist.name}
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
            {playlist.description || 'No description provided.'}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>
            <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{playlist.creator?.name || 'Musico User'}</span>
            <span>•</span>
            <span>{playlist.tracks?.length || 0} tracks</span>
          </div>
        </div>
      </div>

      {/* Playlist Actions bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button 
          onClick={handlePlayPlaylist}
          className="btn btn-primary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            borderRadius: '24px',
            fontSize: '15px'
          }}
        >
          <Play className="w-5 h-5" fill="#070a13" />
          Play Playlist
        </button>
      </div>

      {/* Playlist Tracks Table */}
      {playlist.tracks.length === 0 ? (
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '48px',
          textAlign: 'center',
          color: 'var(--text-secondary)'
        }}>
          <FolderHeart className="w-12 h-12 text-accent" style={{ margin: '0 auto 16px auto', opacity: 0.6 }} />
          <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '8px' }}>This playlist is empty</h3>
          <p style={{ fontSize: '14px' }}>Browse the catalog or search for songs, and use the "Add to Playlist" menus to populate it!</p>
        </div>
      ) : (
        <table className="track-table">
          <thead>
            <tr>
              <th className="table-index">#</th>
              <th>Title</th>
              <th>Genre</th>
              <th>Duration</th>
              <th style={{ width: '80px', textAlign: 'center' }}>Remove</th>
            </tr>
          </thead>
          <tbody>
            {playlist.tracks.map((track, idx) => {
              const isCurrent = currentTrack && currentTrack._id === track._id;
              const formatDuration = (sec) => {
                const m = Math.floor(sec / 60);
                const s = Math.floor(sec % 60);
                return `${m}:${s < 10 ? '0' : ''}${s}`;
              };
              return (
                <tr 
                  key={track._id} 
                  onClick={() => playTrack(track, playlist.tracks)}
                  style={{ 
                    cursor: 'pointer',
                    backgroundColor: isCurrent ? 'rgba(29, 185, 84, 0.03)' : undefined
                  }}
                >
                  <td className="table-index" style={{ color: isCurrent ? 'var(--accent)' : undefined }}>
                    {isCurrent && isPlaying ? (
                      <span className="text-accent" style={{ fontWeight: 'bold' }}>▶</span>
                    ) : idx + 1}
                  </td>
                  <td>
                    <div className="table-track-info">
                      {track.coverUrl ? (
                        <img className="table-cover" src={track.coverUrl} alt={track.title} style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} />
                      ) : (
                        <div className="table-cover" style={{ backgroundColor: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justify: 'center', width: '40px', height: '40px', borderRadius: '4px' }}>
                          <Music className="w-5 h-5 text-accent" />
                        </div>
                      )}
                      <div>
                        <div className="table-title" style={{ color: isCurrent ? 'var(--accent)' : 'var(--text-primary)' }}>
                          {track.title}
                        </div>
                        <div 
                          className="table-artist" 
                          style={{ cursor: 'pointer', textDecoration: 'underline', color: 'var(--accent)' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerProfileView(track.artist, track.isJamendo, track.jamendoArtistId);
                          }}
                        >
                          {track.artistName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="table-genre">{track.genre}</td>
                  <td className="table-duration">{formatDuration(track.duration)}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button 
                      className="btn-icon" 
                      onClick={(e) => handleRemoveTrack(track._id, e)}
                      style={{ background: 'transparent', border: 'none', padding: '4px', cursor: 'pointer' }}
                      title="Remove from Playlist"
                    >
                      <Trash2 className="w-4 h-4" style={{ color: 'var(--danger)', opacity: 0.8 }} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default PlaylistDetailsView;
