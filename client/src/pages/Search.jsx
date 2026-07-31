import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { Search as SearchIcon, Music, Play, Star, Users, Disc3, Disc, Mic, Sparkles, X, Check, Heart, ListPlus } from 'lucide-react';
import PlaylistCover from '../components/PlaylistCover';
import TrackCard from '../components/TrackCard';
import SkeletonLoader from '../components/SkeletonLoader';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop';
const DEFAULT_COVER = 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300&auto=format&fit=crop';

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
    setSearchGenre: setGenre,
    playTrack,
    setShowLyrics,
    toggleLike,
    user
  } = useContext(AppContext);
  
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'songs', 'artists', 'albums', 'playlists'
  
  // Categorized search results state
  const [searchResults, setSearchResults] = useState({
    tracks: [],
    artists: [],
    albums: [],
    playlists: []
  });
  
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const [genresList, setGenresList] = useState([]);
  const [topArtists, setTopArtists] = useState([]);
  const [topTracks, setTopTracks] = useState([]);
  const [topPlaylists, setTopPlaylists] = useState([]);
  const [chartsLoading, setChartsLoading] = useState(false);

  // Fetch landing page categories and charts
  useEffect(() => {
    const fetchSearchLandingData = async () => {
      setChartsLoading(true);
      try {
        const [genresRes, artistsRes, playlistsRes, tracksRes] = await Promise.all([
          fetch(`${API_URL}/tracks/jamendo/genres`),
          fetch(`${API_URL}/auth/artists/top?limit=16`),
          fetch(`${API_URL}/playlists?limit=16`),
          fetch(`${API_URL}/tracks?limit=16`)
        ]);

        if (genresRes.ok) {
          const data = await genresRes.json();
          setGenresList(data.slice(0, 16));
        }
        if (artistsRes.ok) {
          const artistsData = await artistsRes.json();
          setTopArtists(artistsData.slice(0, 8));
        }
        if (playlistsRes.ok) {
          const playlistsData = await playlistsRes.json();
          setTopPlaylists(playlistsData.slice(0, 8));
        }
        if (tracksRes.ok) {
          const tracksData = await tracksRes.json();
          setTopTracks(tracksData.slice(0, 8));
        }
      } catch (err) {
        console.error('Error loading search landing charts:', err);
      } finally {
        setChartsLoading(false);
      }
    };
    fetchSearchLandingData();
  }, [API_URL]);

  // Trigger search on query/genre changes (resets offset)
  useEffect(() => {
    setOffset(0);
    const delayDebounce = setTimeout(() => {
      fetchFilteredTracks(0, false);
    }, 400);

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
            albums: [...prev.albums, ...(data.albums || [])],
            playlists: [...prev.playlists, ...(data.playlists || [])]
          }));
        } else {
          setSearchResults({
            tracks: data.tracks || [],
            artists: data.artists || [],
            albums: data.albums || [],
            playlists: data.playlists || []
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

  const formatDuration = (sec) => {
    if (!sec) return '3:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const showBrowseCategories = search.trim() === '' && genre === 'All';
  const hasAnyResults = searchResults.tracks.length > 0 || searchResults.artists.length > 0 || searchResults.albums.length > 0 || searchResults.playlists.length > 0;

  // Determine Spotify-Style Top Result (Best Match)
  let topResult = null;
  if (searchResults.artists.length > 0 && search.trim().toLowerCase() === searchResults.artists[0].name?.toLowerCase()) {
    topResult = { type: 'artist', item: searchResults.artists[0] };
  } else if (searchResults.tracks.length > 0) {
    topResult = { type: 'song', item: searchResults.tracks[0] };
  } else if (searchResults.artists.length > 0) {
    topResult = { type: 'artist', item: searchResults.artists[0] };
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.3s ease' }}>
      
      {/* 1. SPOTIFY-STYLE SEARCH INPUT */}
      <div>
        <h1 style={{ fontSize: '32px', marginBottom: '16px', fontWeight: '800', fontFamily: 'Outfit' }}>Search</h1>
        <div className="search-box" style={{ width: '100%', maxWidth: '640px', position: 'relative' }}>
          <SearchIcon className="w-5 h-5 text-text-secondary" />
          <input
            type="text"
            placeholder="What do you want to listen to? (Songs, Artists, Albums, Playlists...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute',
                right: '16px',
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. CATEGORY TABS (Spotify UI/UX) */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {[
          { id: 'all', label: 'All' },
          { id: 'songs', label: 'Songs' },
          { id: 'artists', label: 'Artists' },
          { id: 'albums', label: 'Albums & EPs' },
          { id: 'playlists', label: 'Playlists' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 18px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              background: activeTab === tab.id ? '#ffffff' : 'rgba(255, 255, 255, 0.08)',
              color: activeTab === tab.id ? '#000000' : 'var(--text-primary)',
              transition: 'all 0.2s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
        {genre !== 'All' && (
          <button
            onClick={() => setGenre('All')}
            style={{
              padding: '8px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '700',
              border: '1px solid var(--accent)',
              cursor: 'pointer',
              background: 'var(--accent-light)',
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            Genre: {genre} <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 3. BROWSE CATEGORIES (LANDING PAGE VIEW) */}
      {showBrowseCategories ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', animation: 'fadeIn 0.3s ease' }}>
          
          {/* Section 1: Browse Categories */}
          {genresList.length > 0 && (
            <section>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: '800', margin: 0 }}>Browse All Categories</h2>
              </div>
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
                      backgroundColor: g.color || '#3B82F6',
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
                      src={g.cover || DEFAULT_COVER}
                      alt={g.name}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = DEFAULT_COVER;
                      }}
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
          )}

          {/* Section 2: Top Tracks */}
          {topTracks.length > 0 && (
            <section>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: '800', margin: 0 }}>Top Songs</h2>
                <button 
                  onClick={() => {
                    setActiveView('all-tracks');
                    navigate('/pages/all-tracks');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent)',
                    cursor: 'pointer',
                    fontWeight: '700',
                    fontSize: '13.5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    outline: 'none'
                  }}
                >
                  View All <span style={{ fontSize: '12px' }}>→</span>
                </button>
              </div>
              <div className="grid-container carousel-desktop">
                {topTracks.map((track) => (
                  <TrackCard key={track._id} track={track} trackList={topTracks} />
                ))}
              </div>
            </section>
          )}

          {/* Section 3: Top Artists */}
          {topArtists.length > 0 && (
            <section>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: '800', margin: 0 }}>Featured Artists</h2>
                <button 
                  onClick={() => {
                    setActiveView('all-artists');
                    navigate('/pages/all-artists');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent)',
                    cursor: 'pointer',
                    fontWeight: '700',
                    fontSize: '13.5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    outline: 'none'
                  }}
                >
                  View All <span style={{ fontSize: '12px' }}>→</span>
                </button>
              </div>
              <div className="artist-grid-container carousel-desktop">
                {topArtists.map((artist) => (
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
                    <img
                      src={artist.artistAvatar || artist.userAvatar || DEFAULT_AVATAR}
                      alt={artist.artistName || artist.name}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = DEFAULT_AVATAR;
                      }}
                      style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid var(--accent)',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                      }}
                    />
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

        </div>
      ) : loading ? (
        <SkeletonLoader type="grid" count={8} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
          
          {/* SPOTIFY-STYLE TOP RESULT & SONGS SPLIT SECTION (FOR 'ALL' TAB) */}
          {activeTab === 'all' && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: topResult ? 'repeat(auto-fit, minmax(300px, 1fr))' : '1fr',
              gap: '24px',
              alignItems: 'stretch'
            }}>
              
              {/* TOP RESULT HERO CARD */}
              {topResult && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>Top Result</h2>
                  <div
                    onClick={() => {
                      if (topResult.type === 'song') {
                        playTrack(topResult.item, searchResults.tracks);
                      } else {
                        triggerProfileView(topResult.item._id, topResult.item.isJamendo, topResult.item._id);
                      }
                    }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '16px',
                      padding: '24px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative',
                      height: '100%',
                      minHeight: '220px',
                      transition: 'background 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <img
                        src={topResult.type === 'song' ? (topResult.item.coverUrl || DEFAULT_COVER) : (topResult.item.artistAvatar || topResult.item.userAvatar || DEFAULT_AVATAR)}
                        alt={topResult.item.title || topResult.item.name}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = topResult.type === 'song' ? DEFAULT_COVER : DEFAULT_AVATAR;
                        }}
                        style={{
                          width: '92px',
                          height: '92px',
                          borderRadius: topResult.type === 'artist' ? '50%' : '12px',
                          objectFit: 'cover',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
                        }}
                      />
                      <div>
                        <h2 style={{ fontSize: '28px', fontWeight: '900', margin: '0 0 6px 0', color: '#fff', fontFamily: 'Outfit' }}>
                          {topResult.item.title || topResult.item.artistName || topResult.item.name}
                        </h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: '800',
                            textTransform: 'uppercase',
                            background: '#ffffff',
                            color: '#000000',
                            padding: '3px 10px',
                            borderRadius: '12px'
                          }}>
                            {topResult.type === 'song' ? 'Song' : 'Artist'}
                          </span>
                          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                            {topResult.type === 'song' ? topResult.item.artistName : 'Verified Artist'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Spotify Green Circular Play Button */}
                    <div style={{
                      position: 'absolute',
                      bottom: '24px',
                      right: '24px',
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: '#1DB954',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#000',
                      boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
                      transition: 'transform 0.2s ease'
                    }}>
                      <Play fill="currentColor" className="w-5 h-5" style={{ transform: 'translateX(1.5px)' }} />
                    </div>
                  </div>
                </div>
              )}

              {/* SONGS LIST */}
              {searchResults.tracks.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                  <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Music className="w-5 h-5 text-accent" /> Songs
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {searchResults.tracks.slice(0, 5).map((t, idx) => (
                      <div
                        key={t._id}
                        onClick={() => playTrack(t, searchResults.tracks)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid transparent',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                          e.currentTarget.style.borderColor = 'transparent';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                          <span style={{ fontSize: '13px', color: 'var(--text-muted)', width: '16px', textAlign: 'center' }}>
                            {idx + 1}
                          </span>
                          <img
                            src={t.coverUrl || DEFAULT_COVER}
                            alt={t.title}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = DEFAULT_COVER;
                            }}
                            style={{ width: '42px', height: '42px', borderRadius: '6px', objectFit: 'cover' }}
                          />
                          <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {t.title}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {t.artistName}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              playTrack(t, searchResults.tracks);
                              setShowLyrics(true);
                            }}
                            title="Show Lyrics"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-secondary)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <Mic className="w-4 h-4 text-accent" />
                          </button>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', width: '36px', textAlign: 'right' }}>
                            {formatDuration(t.duration)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* FULL SONGS TAB VIEW */}
          {activeTab === 'songs' && searchResults.tracks.length > 0 && (
            <section>
              <h2 style={{ fontSize: '20px', marginBottom: '16px', fontWeight: '800' }}>Songs</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {searchResults.tracks.map((t, idx) => (
                  <div
                    key={t._id}
                    onClick={() => playTrack(t, searchResults.tracks)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-color)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <span style={{ fontSize: '14px', color: 'var(--text-muted)', width: '20px' }}>{idx + 1}</span>
                      <img
                        src={t.coverUrl || DEFAULT_COVER}
                        alt={t.title}
                        onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_COVER; }}
                        style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }}
                      />
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>{t.title}</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{t.artistName} • {t.genre || 'Song'}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          playTrack(t, searchResults.tracks);
                          setShowLyrics(true);
                        }}
                        style={{
                          background: 'rgba(99, 102, 241, 0.15)',
                          border: '1px solid rgba(99, 102, 241, 0.3)',
                          color: 'var(--accent)',
                          padding: '6px 12px',
                          borderRadius: '16px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Mic className="w-3.5 h-3.5" /> Lyrics
                      </button>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{formatDuration(t.duration)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ARTISTS TAB / SECTION */}
          {(activeTab === 'all' || activeTab === 'artists') && searchResults.artists.length > 0 && (
            <section>
              <h2 style={{ fontSize: '20px', marginBottom: '16px', color: 'var(--text-primary)', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                    <img
                      src={artist.artistAvatar || artist.userAvatar || DEFAULT_AVATAR}
                      alt={artist.artistName || artist.name}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = DEFAULT_AVATAR;
                      }}
                      style={{
                        width: '88px',
                        height: '88px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid var(--accent)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                      }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '700',
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '130px'
                      }}>
                        {artist.artistName || artist.name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        Artist
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ALBUMS & EPS TAB / SECTION */}
          {(activeTab === 'all' || activeTab === 'albums') && searchResults.albums.length > 0 && (
            <section>
              <h2 style={{ fontSize: '20px', marginBottom: '16px', color: 'var(--text-primary)', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Disc3 className="w-5 h-5 text-accent" /> Albums & EPs
              </h2>
              <div className="grid-container carousel-desktop">
                {searchResults.albums.map((al) => (
                  <div
                    key={al._id}
                    className="song-card"
                    onClick={() => {
                      setActivePlaylistId(al._id);
                      setActiveView('playlist-details');
                    }}
                  >
                    <div className="song-card-cover-wrapper">
                      <PlaylistCover playlist={al} className="song-card-cover" />
                    </div>
                    <div className="song-card-title">{al.name}</div>
                    <div className="song-card-artist" style={{ color: 'var(--text-muted)' }}>
                      Album • {al.artistName || al.artist?.name || 'Artist'}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* PLAYLISTS TAB / SECTION */}
          {(activeTab === 'all' || activeTab === 'playlists') && searchResults.playlists.length > 0 && (
            <section>
              <h2 style={{ fontSize: '20px', marginBottom: '16px', color: 'var(--text-primary)', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Disc className="w-5 h-5 text-accent" /> Playlists
              </h2>
              <div className="grid-container carousel-desktop">
                {searchResults.playlists.map((pl) => (
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
                      Playlist • {pl.creator?.name || 'Musico User'}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* FALLBACK EMPTY SEARCH STATE */}
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
              <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '8px' }}>No results found for "{search}"</h3>
              <p style={{ fontSize: '14px' }}>Please check your spelling or try searching for another song, artist, album, or playlist.</p>
            </div>
          )}

          {/* PAGING CONTROLS */}
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
