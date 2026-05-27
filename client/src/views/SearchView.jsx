import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { Search, Music, Play } from 'lucide-react';

const SearchView = () => {
  const { API_URL, playTrack } = useContext(AppContext);
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('All');
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(false);

  const genres = ['All', 'Pop', 'Rock', 'Hip Hop', 'Lo-Fi', 'Electronic', 'Jazz', 'Classical', 'R&B'];

  // Handle live searches with a slight debounce or direct effects on state changes
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchFilteredTracks();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [search, genre]);

  const fetchFilteredTracks = async () => {
    setLoading(true);
    try {
      let queryParams = [];
      if (search) queryParams.push(`search=${encodeURIComponent(search)}`);
      if (genre && genre !== 'All') queryParams.push(`genre=${encodeURIComponent(genre)}`);

      const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
      const res = await fetch(`${API_URL}/tracks${queryString}`);
      if (!res.ok) throw new Error('Search failed');
      
      const data = await res.json();
      setTracks(data);
    } catch (error) {
      console.error(error);
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
            placeholder="What do you want to listen to?"
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

      {/* Results grid */}
      <section style={{ marginTop: '12px' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '16px', color: 'var(--text-secondary)' }}>
          {search || genre !== 'All' ? 'Search Results' : 'Explore All Sounds'}
        </h2>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <div className="spinner"></div>
          </div>
        ) : tracks.length === 0 ? (
          <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Music className="w-12 h-12 text-accent" style={{ margin: '0 auto 16px auto', opacity: 0.6 }} />
            <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '8px' }}>No matches found</h3>
            <p style={{ fontSize: '14px' }}>Try double-checking spelling or browsing other genres.</p>
          </div>
        ) : (
          <div className="grid-container">
            {tracks.map((track) => (
              <div 
                key={track._id} 
                className="song-card"
                onClick={() => playTrack(track, tracks)}
              >
                <div className="song-card-cover-wrapper">
                  {track.coverUrl ? (
                    <img className="song-card-cover" src={track.coverUrl} alt={track.title} />
                  ) : (
                    <div style={{ backgroundColor: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justify: 'center', width: '100%', height: '100%' }}>
                      <Music className="w-12 h-12 text-accent" />
                    </div>
                  )}
                  <div className="song-card-play-hover">
                    <Play fill="white" className="w-6 h-6" style={{ transform: 'translateX(1px)' }} />
                  </div>
                </div>
                <div className="song-card-title">{track.title}</div>
                <div className="song-card-artist">{track.artistName}</div>
                <div className="song-card-genre">{track.genre}</div>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
};

export default SearchView;
