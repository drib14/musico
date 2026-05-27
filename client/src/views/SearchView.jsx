import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { Search, Music, Play, Star, Users, Disc3, Disc, CheckCircle } from 'lucide-react';
import PlaylistCover from '../components/PlaylistCover';

const SearchView = () => {
  const { 
    API_URL, 
    playTrack, 
    triggerProfileView, 
    token, 
    userPlaylists, 
    showToast,
    setActiveView,
    setActivePlaylistId,
    searchGenre: genre,
    setSearchGenre: setGenre
  } = useContext(AppContext);
  
  const [search, setSearch] = useState('');
  
  // Categorized search results state
  const [searchResults, setSearchResults] = useState({
    tracks: [],
    artists: [],
    albums: []
  });
  
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);

  const handleSaveToDb = async (e, trackId) => {
    e.stopPropagation();
    if (!token) {
      showToast('Please log in to save tracks to the database!', 'error');
      return;
    }
    setSavingId(trackId);
    try {
      const res = await fetch(`${API_URL}/tracks/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ trackId })
      });
      if (res.ok) {
        showToast('Track imported to Musico DB successfully!');
        setSearchResults(prev => ({
          ...prev,
          tracks: prev.tracks.map(t => t._id === trackId ? { ...t, isJamendo: false } : t)
        }));
      } else {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to save track');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingId(null);
    }
  };

  const genres = ['All', 'Pop', 'Rock', 'Hip Hop', 'Lo-Fi', 'Electronic', 'Jazz', 'Classical', 'Acoustic', 'Folk', 'Metal', 'Ambient', 'Reggae', 'R&B', 'Soundtrack', 'Country'];

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
      let queryParams = [];
      if (search) queryParams.push(`search=${encodeURIComponent(search)}`);
      if (genre && genre !== 'All') queryParams.push(`genre=${encodeURIComponent(genre)}`);

      const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
      const res = await fetch(`${API_URL}/tracks/search${queryString}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults({
          tracks: data.tracks || [],
          artists: data.artists || [],
          albums: data.albums || []
        });
      }
    } catch (error) {
      console.error('Unified search index load failed:', error);
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
            placeholder="Search songs, artists, playlists, albums..."
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
          
          {/* SECTION 1: SONGS (TRACKS) */}
          <section>
            <h2 style={{ fontSize: '20px', marginBottom: '16px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Music className="w-5 h-5 text-accent" /> Songs
            </h2>
            
            {searchResults.tracks.length === 0 ? (
              <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <p style={{ fontSize: '14px' }}>No songs found matching criteria.</p>
              </div>
            ) : (
              <div className="grid-container">
                  {searchResults.tracks.map((track) => (
                    <div 
                      key={track._id} 
                      className="song-card"
                      onClick={() => playTrack(track, searchResults.tracks)}
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
                          triggerProfileView(track.artist, track.isJamendo, track.jamendoArtistId);
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

          {/* SECTION 2: ARTISTS */}
          <section>
            <h2 style={{ fontSize: '20px', marginBottom: '16px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users className="w-5 h-5 text-accent" /> Artists
            </h2>
            
            {searchResults.artists.length === 0 ? (
              <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <p style={{ fontSize: '14px' }}>No creators or artists found matching criteria.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '20px' }}>
                {searchResults.artists.map((artist) => (
                  <div
                    key={artist._id}
                    onClick={() => triggerProfileView(artist._id, artist.isJamendo, artist._id)}
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '16px',
                      padding: '20px 16px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'all 0.25s ease',
                      boxShadow: 'var(--glass-shadow)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                    }}
                  >
                    {artist.artistAvatar || artist.userAvatar ? (
                      <img
                        src={artist.artistAvatar || artist.userAvatar}
                        alt={artist.artistName || artist.name}
                        style={{
                          width: '80px',
                          height: '80px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '2px solid var(--accent)',
                          boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: 'var(--accent-gradient)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '28px',
                        fontWeight: 'bold',
                        fontFamily: 'Outfit'
                      }}>
                        {(artist.artistName || artist.name).charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: '700',
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '120px'
                      }}>
                        {artist.artistName || artist.name}
                        {artist.isArtistVerified && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '12px',
                            height: '12px',
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
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {artist.isJamendo ? 'Licensed Artist' : 'Musico Creator'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* SECTION 3: PLAYLISTS & ALBUMS */}
          <section>
            <h2 style={{ fontSize: '20px', marginBottom: '16px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Disc3 className="w-5 h-5 text-accent" /> Playlists & Albums
            </h2>
            
            {searchResults.albums.length === 0 ? (
              <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <p style={{ fontSize: '14px' }}>No playlists or albums found matching criteria.</p>
              </div>
            ) : (
              <div className="grid-container">
                {searchResults.albums.map((pl) => (
                  <div
                    key={pl._id}
                    className="song-card"
                    onClick={() => {
                      setActivePlaylistId(pl._id);
                      setActiveView('playlist-details');
                    }}
                  >
                    <div className="song-card-cover-wrapper">
                      <PlaylistCover playlist={pl} className="song-card-cover" />
                    </div>
                    <div className="song-card-title">{pl.name}</div>
                    <div className="song-card-artist" style={{ color: 'var(--text-muted)' }}>
                      {pl.isJamendoAlbum 
                        ? `Album by ${pl.artistName}` 
                        : `Playlist • ${pl.creator?.name || 'Musico User'}`
                      }
                    </div>
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
