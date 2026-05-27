import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { Search, Music, Play, Star, Users, Disc3 } from 'lucide-react';

const SearchView = () => {
  const { API_URL, playTrack, triggerProfileView, token, userPlaylists, showToast } = useContext(AppContext);
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('All');
  
  // Local direct uploads matches state
  const [localTracks, setLocalTracks] = useState([]);
  
  const [loading, setLoading] = useState(false);

  const genres = ['All', 'Pop', 'Rock', 'Hip Hop', 'Lo-Fi', 'Electronic', 'Jazz', 'Classical', 'R&B'];

  // Trigger parallel local and Spotify searches on input query changes
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchFilteredTracks();
    }, 450);

    return () => clearTimeout(delayDebounce);
  }, [search, genre]);

  const fetchFilteredTracks = async () => {
    setLoading(true);
    try {
      // 1. Fetch Local Direct Uploads
      let localQueryParams = [];
      if (search) localQueryParams.push(`search=${encodeURIComponent(search)}`);
      if (genre && genre !== 'All') localQueryParams.push(`genre=${encodeURIComponent(genre)}`);

      const localQueryString = localQueryParams.length > 0 ? `?${localQueryParams.join('&')}` : '';
      const localRes = await fetch(`${API_URL}/tracks${localQueryString}`);
      if (localRes.ok) {
        const localData = await localRes.json();
        setLocalTracks(localData);
      }
    } catch (error) {
      console.error('Local search indexing failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Search Input Bar */}
      <div>
        <h1 style={{ fontSize: '32px', marginBottom: '16px' }}>Search</h1>
        <div className="search-box" style={{ width: '100%', maxWidth: '600px' }}>
          <Search className="w-5 h-5 text-text-secondary" />
          <input
            type="text"
            placeholder="Search songs, artists, albums..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Genre Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
        {genres.map((g) => (
          <button
            key={g}
            className={`btn ${genre === g ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              padding: '6px 16px',
              borderRadius: '99px',
              fontSize: '13px'
            }}
            onClick={() => setGenre(g)}
          >
            {g}
          </button>
        ))}
      </div>

      {/* Results division */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
          <div className="spinner"></div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
          
          {/* SECTION A: DIRECT UPLOADS (LOCAL DATABASE) */}
          <section>
            <h2 style={{ fontSize: '20px', marginBottom: '16px', color: 'var(--text-secondary)' }}>
              Musico Direct Uploads
            </h2>
            
            {localTracks.length === 0 ? (
              <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <p style={{ fontSize: '14px' }}>No local user uploads found matching criteria.</p>
              </div>
            ) : (
              <div className="grid-container">
                  {localTracks.map((track) => (
                    <div 
                      key={track._id} 
                      className="song-card"
                      onClick={() => playTrack(track, localTracks)}
                    >
                      <div className="song-card-cover-wrapper">
                        <img className="song-card-cover" src={track.coverUrl} alt={track.title} />
                        <div className="song-card-play-hover">
                          <Play fill="white" className="w-6 h-6" style={{ transform: 'translateX(1px)' }} />
                        </div>
                      </div>
                      <div className="song-card-title">{track.title}</div>
                      
                      {/* Clickable Artist link */}
                      <div 
                        className="song-card-artist"
                        style={{ textDecoration: 'underline', color: 'var(--accent)', cursor: 'pointer' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerProfileView(track.artist);
                        }}
                      >
                        {track.artistName}
                      </div>
                      <div className="song-card-genre" style={{ marginBottom: '4px' }}>{track.genre}</div>

                      {/* Inline Dropdown menu to add to custom playlists */}
                      {token && userPlaylists && userPlaylists.length > 0 && (
                        <div 
                          style={{ width: '100%', marginTop: '6px' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <select 
                            defaultValue=""
                            onChange={async (e) => {
                              const playlistId = e.target.value;
                              if (!playlistId) return;
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
                                } else {
                                  showToast(data.message || 'Error adding to playlist', 'error');
                                }
                              } catch (err) {
                                showToast('Failed to add track', 'error');
                              }
                              e.target.value = ""; // Reset select
                            }}
                            style={{
                              background: 'rgba(255,255,255,0.05)',
                              color: 'var(--text-secondary)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: '8px',
                              fontSize: '11px',
                              padding: '4px 6px',
                              cursor: 'pointer',
                              width: '100%',
                              outline: 'none'
                            }}
                          >
                            <option value="" disabled>+ Add to Playlist</option>
                            {userPlaylists.map(pl => (
                              <option key={pl._id} value={pl._id}>{pl.name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </section>
        </div>
      )}

    </div>
  );
};

export default SearchView;
