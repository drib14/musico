import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { Search, Music, Play, Star } from 'lucide-react';

const SearchView = () => {
  const { API_URL, playTrack, triggerProfileView } = useContext(AppContext);
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('All');
  
  // Local direct uploads matches state
  const [localTracks, setLocalTracks] = useState([]);
  
  // Spotify global catalog search results state
  const [spotifyTracks, setSpotifyTracks] = useState([]);
  
  const [loading, setLoading] = useState(false);

  const genres = ['All', 'Pop', 'Rock', 'Hip Hop', 'Lo-Fi', 'Electronic', 'Jazz', 'Classical', 'R&B'];

  // Trigger parallel local and Spotify searches on input query changes
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchFilteredTracks();
    }, 400);

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

      // 2. Fetch Spotify Catalog results (only if a text search query exists)
      if (search && search.trim().length > 0) {
        const spotifyRes = await fetch(`${API_URL}/spotify/search?query=${encodeURIComponent(search)}&limit=6`);
        if (spotifyRes.ok) {
          const spotifyData = await spotifyRes.json();
          setSpotifyTracks(spotifyData);
        }
      } else {
        // Clear Spotify search catalog results if search query is empty
        setSpotifyTracks([]);
      }
    } catch (error) {
      console.error('Dual search indexing failed:', error);
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
            placeholder="Search tracks, artists, or genres..."
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
                    <div className="song-card-genre">{track.genre}</div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* SECTION B: SPOTIFY MAINSTREAM CATALOG (GLOBAL API SEARCH) */}
          {search && (
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Star className="w-5 h-5 text-accent" style={{ color: '#1DB954' }} />
                <h2 style={{ fontSize: '20px', color: 'var(--text-secondary)' }}>
                  Mainstream Global Catalog
                </h2>
                <span className="billing-badge" style={{ backgroundColor: 'rgba(29, 185, 84, 0.12)', color: '#1DB954', border: '1.5px solid rgba(29, 185, 84, 0.15)' }}>
                  Spotify Catalog
                </span>
              </div>

              {spotifyTracks.length === 0 ? (
                <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <p style={{ fontSize: '14px' }}>No matches found inside Spotify catalog.</p>
                </div>
              ) : (
                <div className="grid-container">
                  {spotifyTracks.map((track) => (
                    <div 
                      key={track._id} 
                      className="song-card"
                      onClick={() => {
                        if (track.audioUrl) {
                          playTrack(track, spotifyTracks);
                        } else {
                          alert('Spotify preview audio unavailable for this mainstream track');
                        }
                      }}
                    >
                      <div className="song-card-cover-wrapper">
                        <img className="song-card-cover" src={track.coverUrl} alt={track.title} />
                        <div className="song-card-play-hover">
                          <Play fill="white" className="w-6 h-6" style={{ transform: 'translateX(1px)' }} />
                        </div>
                      </div>
                      <div className="song-card-title">{track.title}</div>
                      <div className="song-card-artist" style={{ cursor: 'default', color: 'var(--text-secondary)' }}>
                        {track.artistName}
                      </div>
                      <div className="song-card-genre" style={{ backgroundColor: 'rgba(29, 185, 84, 0.12)', color: '#1DB954' }}>
                        Spotify Stream
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

        </div>
      )}

    </div>
  );
};

export default SearchView;
