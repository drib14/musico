import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { Play, Music, Heart, UploadCloud, FolderHeart, Plus, Folder, Trash2 } from 'lucide-react';

const LibraryView = () => {
  const { API_URL, token, playTrack, toggleLike, showToast } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState('liked'); // 'liked', 'uploads', 'playlists'
  
  // Data lists states
  const [likedSongs, setLikedSongs] = useState([]);
  const [myUploads, setMyUploads] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(false);

  // Playlist creation states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');

  useEffect(() => {
    if (token) {
      loadLibraryData();
    }
  }, [activeTab, token]);

  const loadLibraryData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'liked') {
        const res = await fetch(`${API_URL}/tracks/liked`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to load liked songs');
        const data = await res.json();
        setLikedSongs(data);
      } else if (activeTab === 'uploads') {
        const res = await fetch(`${API_URL}/tracks/my-uploads`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to load uploads');
        const data = await res.json();
        setMyUploads(data);
      } else if (activeTab === 'playlists') {
        const res = await fetch(`${API_URL}/playlists/my-playlists`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to load playlists');
        const data = await res.json();
        setPlaylists(data);
      }
    } catch (error) {
      console.error(error);
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Create Playlist Handler
  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    if (!newPlaylistName) return showToast('Playlist name is required', 'error');

    try {
      const res = await fetch(`${API_URL}/playlists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: newPlaylistName, description: newPlaylistDesc })
      });

      if (!res.ok) throw new Error('Failed to create playlist');
      
      showToast('Playlist created successfully!');
      setNewPlaylistName('');
      setNewPlaylistDesc('');
      setShowCreateForm(false);
      loadLibraryData();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  // Delete Playlist Handler
  const handleDeletePlaylist = async (playlistId, e) => {
    e.stopPropagation(); // Avoid triggering open actions
    if (!window.confirm('Are you sure you want to delete this playlist?')) return;

    try {
      const res = await fetch(`${API_URL}/playlists/${playlistId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to remove playlist');
      showToast('Playlist deleted');
      loadLibraryData();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  // Unlike Song shortcut inside list
  const handleUnlikeSong = async (trackId, e) => {
    e.stopPropagation();
    await toggleLike(trackId);
    // Refresh liked songs locally
    loadLibraryData();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 1. LIBRARY SUB-NAV TABS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          {[
            { id: 'liked', label: 'Liked Songs', icon: Heart },
            { id: 'uploads', label: 'My Uploads', icon: UploadCloud },
            { id: 'playlists', label: 'Playlists', icon: Folder }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'none',
                  border: 'none',
                  borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                  padding: '8px 4px',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '16px',
                  transition: 'all var(--transition-fast)'
                }}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Playlist Option Shortcut Button */}
        {activeTab === 'playlists' && (
          <button className="btn btn-primary btn-icon" onClick={() => setShowCreateForm(true)}>
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* CREATE PLAYLIST POPUP BOX */}
      {showCreateForm && (
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          animation: 'slide-up 0.3s ease'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Create New Playlist</h3>
          <form onSubmit={handleCreatePlaylist} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="form-group">
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '12px' }}
                placeholder="Playlist name"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '12px' }}
                placeholder="Description (Optional)"
                value={newPlaylistDesc}
                onChange={(e) => setNewPlaylistDesc(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" style={{ padding: '6px 12px' }} onClick={() => setShowCreateForm(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" style={{ padding: '6px 16px' }}>
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. DYNAMIC CONTENT RENDERING */}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div className="spinner"></div>
        </div>
      ) : (
        <>
          {/* TAB: LIKED SONGS */}
          {activeTab === 'liked' && (
            likedSongs.length === 0 ? (
              <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <FolderHeart className="w-12 h-12 text-accent" style={{ margin: '0 auto 16px auto', opacity: 0.6 }} />
                <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '8px' }}>Songs you like will appear here</h3>
                <p style={{ fontSize: '14px' }}>Save tracks to your collection by clicking the heart icon on the music player.</p>
              </div>
            ) : (
              <table className="track-table">
                <thead>
                  <tr>
                    <th className="table-index">#</th>
                    <th>Title</th>
                    <th>Genre</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {likedSongs.map((track, idx) => (
                    <tr key={track._id} onClick={() => playTrack(track, likedSongs)} style={{ cursor: 'pointer' }}>
                      <td className="table-index">{idx + 1}</td>
                      <td>
                        <div className="table-track-info">
                          {track.coverUrl ? (
                            <img className="table-cover" src={track.coverUrl} alt={track.title} />
                          ) : (
                            <div className="table-cover" style={{ backgroundColor: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justify: 'center' }}>
                              <Music className="w-5 h-5 text-accent" />
                            </div>
                          )}
                          <div>
                            <div className="table-title">{track.title}</div>
                            <div className="table-artist">{track.artistName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="table-genre">{track.genre}</td>
                      <td>
                        <button className="btn-icon" onClick={(e) => handleUnlikeSong(track._id, e)}>
                          <Heart fill="var(--danger)" className="w-4 h-4 text-danger" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}

          {/* TAB: MY UPLOADS */}
          {activeTab === 'uploads' && (
            myUploads.length === 0 ? (
              <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <UploadCloud className="w-12 h-12 text-accent" style={{ margin: '0 auto 16px auto', opacity: 0.6 }} />
                <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '8px' }}>No direct uploads found</h3>
                <p style={{ fontSize: '14px' }}>Got audio tracks ready to stream? Distribute them instantly in the Upload center!</p>
              </div>
            ) : (
              <table className="track-table">
                <thead>
                  <tr>
                    <th className="table-index">#</th>
                    <th>Title</th>
                    <th>Genre</th>
                    <th>Plays</th>
                  </tr>
                </thead>
                <tbody>
                  {myUploads.map((track, idx) => (
                    <tr key={track._id} onClick={() => playTrack(track, myUploads)} style={{ cursor: 'pointer' }}>
                      <td className="table-index">{idx + 1}</td>
                      <td>
                        <div className="table-track-info">
                          {track.coverUrl ? (
                            <img className="table-cover" src={track.coverUrl} alt={track.title} />
                          ) : (
                            <div className="table-cover" style={{ backgroundColor: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justify: 'center' }}>
                              <Music className="w-5 h-5 text-accent" />
                            </div>
                          )}
                          <div>
                            <div className="table-title">{track.title}</div>
                            <div className="table-artist">{track.artistName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="table-genre">{track.genre}</td>
                      <td className="table-plays">{track.plays} streams</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}

          {/* TAB: PLAYLISTS INDEX */}
          {activeTab === 'playlists' && (
            playlists.length === 0 ? (
              <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <Folder className="w-12 h-12 text-accent" style={{ margin: '0 auto 16px auto', opacity: 0.6 }} />
                <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '8px' }}>No playlists created</h3>
                <p style={{ fontSize: '14px', marginBottom: '16px' }}>Group your favorite sounds by creating custom playlists.</p>
                <button className="btn btn-primary" onClick={() => setShowCreateForm(true)}>
                  Create Your First Playlist
                </button>
              </div>
            ) : (
              <div className="grid-container">
                {playlists.map((pl) => (
                  <div
                    key={pl._id}
                    className="song-card"
                    style={{ position: 'relative' }}
                  >
                    <div className="song-card-cover-wrapper">
                      {pl.coverUrl ? (
                        <img className="song-card-cover" src={pl.coverUrl} alt={pl.name} />
                      ) : (
                        <div style={{ backgroundColor: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justify: 'center', width: '100%', height: '100%' }}>
                          <Folder className="w-12 h-12 text-accent" />
                        </div>
                      )}
                    </div>
                    <div className="song-card-title">{pl.name}</div>
                    <div className="song-card-artist" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <span>{pl.tracks.length} songs</span>
                      
                      {/* Delete Playlist Button */}
                      <button 
                        className="btn-icon" 
                        style={{ border: 'none', background: 'transparent', padding: '4px' }}
                        onClick={(e) => handleDeletePlaylist(pl._id, e)}
                        title="Delete Playlist"
                      >
                        <Trash2 className="w-4 h-4" style={{ color: 'var(--danger)' }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </>
      )}

    </div>
  );
};

export default LibraryView;
