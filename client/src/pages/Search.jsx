import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { Search as SearchIcon, Music, Play, Star, Users, Disc3, Disc } from 'lucide-react';
import PlaylistCover from '../components/PlaylistCover';
import TrackCard from '../components/TrackCard';

const Search = () => {
  const { 
    API_URL, 
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const genres = ['All', 'Pop', 'Rock', 'Hip Hop', 'Lo-Fi', 'Electronic', 'Jazz', 'Classical', 'Acoustic', 'Folk', 'Metal', 'Ambient', 'Reggae', 'R&B', 'Soundtrack', 'Country'];
  const [genresList, setGenresList] = useState([]);

  // Fetch genres for Browse Categories (exactly 8 cards)
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const res = await fetch(`${API_URL}/tracks/jamendo/genres`);
        if (res.ok) {
          const data = await res.json();
          // Slice genres list to exactly 8 cards
          setGenresList(data.slice(0, 8));
        }
      } catch (err) {
        console.error('Error loading Jamendo genres in search page:', err);
      }
    };
    fetchGenres();
  }, [API_URL]);

  // Trigger search on query/genre changes (resets pagination offset)
  useEffect(() => {
    setOffset(0);
    const delayDebounce = setTimeout(() => {
      fetchFilteredTracks(0, false);
    }, 450);

    return () => clearTimeout(delayDebounce);
  }, [search, genre]);

  useEffect(() => {
    const handleSetGlobalSearch = (e) => {
      setSearch(e.detail);
      setGenre('All');
    };
    window.addEventListener('setGlobalSearch', handleSetGlobalSearch);
    return () => {
      window.removeEventListener('setGlobalSearch', handleSetGlobalSearch);
    };
  }, []);

  const fetchFilteredTracks = async (currentOffset, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    
    try {
      let queryParams = [`limit=${limit}`, `offset=${currentOffset}`];
      if (search) queryParams.push(`search=${encodeURIComponent(search)}`);
      if (genre && genre !== 'All') queryParams.push(`genre=${encodeURIComponent(genre)}`);

      const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
      const res = await fetch(`${API_URL}/tracks/search${queryString}`);
      if (res.ok) {
        const data = await res.json();
        if (append) {
          setSearchResults(prev => ({
            tracks: [...prev.tracks, ...(data.tracks || [])],
            artists: [...prev.artists, ...(data.artists || [])],
            albums: [...prev.albums, ...(data.albums || [])]
          }));
        } else {
          setSearchResults({
            tracks: data.tracks || [],
            artists: data.artists || [],
            albums: data.albums || []
          });
        }
      }
    } catch (error) {
      console.error('Unified search index load failed:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    const nextOffset = offset + limit;
    setOffset(nextOffset);
    fetchFilteredTracks(nextOffset, true);
  };

  const showBrowseCategories = search.trim() === '' && genre === 'All';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Search Input Bar */}
      <div>
        <h1 style={{ fontSize: '32px', marginBottom: '16px' }}>Search</h1>
        <div className="search-box" style={{ width: '100%', maxWidth: '600px' }}>
          <SearchIcon className="w-5 h-5 text-text-secondary" />
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

      {/* Results division or Browse Categories */}
      {showBrowseCategories ? (
        genresList.length > 0 && (
          <section style={{ animation: 'fadeIn 0.3s ease' }}>
            <h2 style={{ fontSize: '22px', marginBottom: '16px', fontWeight: 'bold' }}>Browse All</h2>
            <div className="genre-grid-container" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '20px'
            }}>
              {genresList.map((g, idx) => (
                <div
                  key={idx}
                  className="genre-card"
                  style={{
                    position: 'relative',
                    height: '110px',
                    borderRadius: '12px',
                    padding: '16px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    backgroundColor: g.color,
                    boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.03)';
                    e.currentTarget.style.boxShadow = '0 6px 15px rgba(0,0,0,0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.15)';
                  }}
                  onClick={() => {
                    setGenre(g.name);
                  }}
                >
                  <h3 style={{ fontSize: '18px', color: '#ffffff', fontWeight: '800', margin: 0 }}>{g.name}</h3>
                  <img
                    src={g.cover}
                    alt={g.name}
                    style={{
                      position: 'absolute',
                      right: '-15px',
                      bottom: '-15px',
                      width: '70px',
                      height: '70px',
                      borderRadius: '6px',
                      transform: 'rotate(25deg)',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                      objectFit: 'cover'
                    }}
                  />
                </div>
              ))}
            </div>
          </section>
        )
      ) : loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
          <div className="spinner"></div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
          
          {/* SECTION 1: SONGS (TRACKS) */}
          {searchResults.tracks.length > 0 && (
            <section>
              <h2 style={{ fontSize: '20px', marginBottom: '16px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Music className="w-5 h-5 text-accent" /> Songs
              </h2>
              <div className="grid-container carousel-desktop">
                {searchResults.tracks.map((track) => (
                  <TrackCard key={track._id} track={track} trackList={searchResults.tracks} />
                ))}
              </div>
            </section>
          )}

          {/* SECTION 2: ARTISTS */}
          {searchResults.artists.length > 0 && (
            <section>
              <h2 style={{ fontSize: '20px', marginBottom: '16px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users className="w-5 h-5 text-accent" /> Artists
              </h2>
              <div className="artist-grid-container carousel-desktop">
                {searchResults.artists.map((artist) => (
                  <div
                    key={artist._id}
                    className="artist-card"
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
            </section>
          )}

          {/* SECTION 3: PLAYLISTS & ALBUMS */}
          {searchResults.albums.length > 0 && (
            <section>
              <h2 style={{ fontSize: '20px', marginBottom: '16px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Disc3 className="w-5 h-5 text-accent" /> Playlists & Albums
              </h2>
              <div className="grid-container carousel-desktop">
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
            </section>
          )}

          {/* Fallback empty view */}
          {!hasAnyResults && (
            <div style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '60px 40px',
              textAlign: 'center',
              color: 'var(--text-secondary)'
            }}>
              <Music className="w-12 h-12 text-accent" style={{ margin: '0 auto 16px auto', opacity: 0.5 }} />
              <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '8px' }}>No matches found</h3>
              <p style={{ fontSize: '14px' }}>Try exploring other genres or check spelling for songs or artists.</p>
            </div>
          )}

          {/* Paging controls */}
          {hasAnyResults && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '12px' }}>
              <button 
                className="btn btn-secondary" 
                onClick={handleLoadMore}
                disabled={loadingMore}
                style={{
                  padding: '10px 24px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {loadingMore ? (
                  <>
                    <div className="spinner" style={{ width: '12px', height: '12px' }}></div>
                    Loading...
                  </>
                ) : (
                  'Load More Results'
                )}
              </button>
            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default Search;

