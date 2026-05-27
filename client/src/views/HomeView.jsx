import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { Play, Music, Crown, Globe, MapPin, Disc, Star, Users, Disc3, ArrowRight } from 'lucide-react';
import PlaylistCover from '../components/PlaylistCover';

const HomeView = () => {
  const { 
    API_URL, 
    playTrack, 
    history, 
    user, 
    token, 
    userPlaylists, 
    loadUserPlaylists, 
    activeView, 
    setActiveView, 
    setActiveChart, 
    triggerProfileView, 
    userLocation, 
    showToast,
    setActivePlaylistId,
    setSearchGenre
  } = useContext(AppContext);
  
  // Trending local direct uploads charts states
  const [trendingTracks, setTrendingTracks] = useState([]);
  const [period, setPeriod] = useState('week'); // 'week', 'month', 'year'
  const [scope, setScope] = useState('global'); // 'global', 'local'
  const [chartsLoading, setChartsLoading] = useState(false);

  // Home extra Spotify Tops states
  const [topArtists, setTopArtists] = useState([]);
  const [topPlaylists, setTopPlaylists] = useState([]);

  // All local pools states
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
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
        // Update both lists
        setTracks(prev => prev.map(t => t._id === trackId ? { ...t, isJamendo: false } : t));
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

  // Load trending local charts
  useEffect(() => {
    fetchTrendingCharts();
  }, [period, scope, userLocation]);

  const fetchTrendingCharts = async () => {
    setChartsLoading(true);
    try {
      let queryParams = [`period=${period}`, `scope=${scope}`];
      if (scope === 'local' && userLocation.city) {
        queryParams.push(`city=${encodeURIComponent(userLocation.city)}`);
      }
      
      const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
      const res = await fetch(`${API_URL}/tracks/trending${queryString}`);
      if (!res.ok) throw new Error('Failed to retrieve trending charts');
      const data = await res.json();
      setTrendingTracks(data);
    } catch (err) {
      console.error('Error fetching trending tracks:', err);
    } finally {
      setChartsLoading(false);
    }
  };

  // Load Spotify Tops
  useEffect(() => {
    const fetchHomeExtras = async () => {
      try {
        const artistsRes = await fetch(`${API_URL}/auth/artists/top`);
        if (artistsRes.ok) {
          const artistsData = await artistsRes.json();
          setTopArtists(artistsData);
        }

        const playlistsRes = await fetch(`${API_URL}/playlists`);
        if (playlistsRes.ok) {
          const playlistsData = await playlistsRes.json();
          setTopPlaylists(playlistsData.slice(0, 10)); // Top 10 public playlists
        }
      } catch (err) {
        console.error('Error loading home featured sections:', err);
      }
    };
    fetchHomeExtras();
  }, []);

  // Load overall local tracks list
  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const res = await fetch(`${API_URL}/tracks`);
        if (!res.ok) throw new Error('Failed to retrieve tracks');
        const data = await res.json();
        setTracks(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchTracks();
  }, []);

  // Dynamic genres state loaded from Jamendo API
  const [genresList, setGenresList] = useState([]);

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const res = await fetch(`${API_URL}/tracks/jamendo/genres`);
        if (res.ok) {
          const data = await res.json();
          setGenresList(data);
        }
      } catch (err) {
        console.error('Error loading Jamendo dynamic genres:', err);
      }
    };
    fetchGenres();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
      
      {/* 1. HERO BANNER */}
      <div className="hero-banner">
        <span className="hero-subtitle">Musico Self-Distribution</span>
        <h1 className="hero-title">Skip the Middleman. Upload Direct.</h1>
        <p className="hero-desc">
          Tired of third-party distributors? At Musico, creators upload files directly to our platform, getting immediate streaming metrics and feedback.
        </p>
        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <button 
            className="btn btn-primary" 
            onClick={() => setActiveView(user ? 'upload' : 'billing')}
          >
            {user?.isPremium ? 'Upload Song Now' : 'Join Premium Tier'}
          </button>
          {!user?.isPremium && (
            <button className="btn btn-secondary" onClick={() => setActiveView('billing')}>
              <Crown className="w-4 h-4 text-premium-color" /> Learn More
            </button>
          )}
        </div>
      </div>

      {/* 2. Featured Playlists & Featured Albums (Spotify Style) */}
      <section>
        <h2 style={{ fontSize: '22px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Disc3 className="w-6 h-6 text-accent" /> Featured Playlists & Collections
        </h2>
        {topPlaylists.length === 0 ? (
          <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '36px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <p style={{ fontSize: '13px' }}>Create public playlists to show them here on the global charts!</p>
          </div>
        ) : (
          <div className="grid-container">
            {topPlaylists.map((pl) => (
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
                  By {pl.creator?.name || 'Musico'} • {pl.tracks?.length || 0} tracks
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. POPULAR ARTISTS (Spotify Style slot circles) */}
      <section>
        <h2 style={{ fontSize: '22px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users className="w-6 h-6 text-accent" /> Popular Artists
        </h2>
        {topArtists.length === 0 ? (
          <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>No trending creators yet.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '20px' }}>
            {topArtists.map((artist) => (
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
                      width: '90px',
                      height: '90px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2.5px solid var(--accent)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '90px',
                    height: '90px',
                    borderRadius: '50%',
                    background: 'var(--accent-gradient)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '32px',
                    fontWeight: 'bold',
                    fontFamily: 'Outfit'
                  }}>
                    {(artist.artistName || artist.name).charAt(0).toUpperCase()}
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
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
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Artist</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>



      {/* 5. IMMERSIVE SPOTIFY-STYLE TOP CHART CARDS */}
      <section>
        <h2 style={{ fontSize: '22px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Disc className="w-6 h-6 text-accent" /> Featured Top Charts
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '24px' }}>
          {[
            {
              id: 'top-10-global',
              title: 'Top 10 Global Hits',
              desc: 'The ten most streamed tracks across the globe this week.',
              scope: 'global',
              limit: 10,
              gradient: 'linear-gradient(135deg, #0d1b3e 0%, #1d4ed8 100%)',
              icon: Globe
            },
            {
              id: 'top-10-local',
              title: 'Top 10 Local Hits',
              desc: `Trending tracks getting the most plays in ${userLocation.city || 'your city'}.`,
              scope: 'local',
              limit: 10,
              gradient: 'linear-gradient(135deg, #451a03 0%, #d97706 100%)',
              icon: MapPin
            },
            {
              id: 'top-20-global',
              title: 'Top 20 Global Charts',
              desc: 'Top 20 hottest releases updated hourly based on streaming activity.',
              scope: 'global',
              limit: 20,
              gradient: 'linear-gradient(135deg, #064e3b 0%, #059669 100%)',
              icon: Disc
            },
            {
              id: 'top-50-global',
              title: 'Top 50 Global Charts',
              desc: 'The complete top 50 direct distribution tracks globally.',
              scope: 'global',
              limit: 50,
              gradient: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%)',
              icon: Star
            }
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                onClick={() => {
                  setActiveChart({
                    title: card.title,
                    scope: card.scope,
                    limit: card.limit,
                    gradient: card.gradient
                  });
                  setActiveView('chart-details');
                }}
                style={{
                  background: card.gradient,
                  borderRadius: '16px',
                  padding: '24px',
                  height: '220px',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: 'var(--glass-shadow)',
                  transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--glass-shadow)';
                }}
              >
                {/* Visual decoration overlay */}
                <div style={{
                  position: 'absolute',
                  right: '-10px',
                  bottom: '-10px',
                  opacity: 0.1,
                  transform: 'rotate(-10deg)',
                  pointerEvents: 'none'
                }}>
                  <Icon style={{ width: '130px', height: '130px', color: '#fff' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', zIndex: 2 }}>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    padding: '3px 8px',
                    borderRadius: '20px',
                    width: 'fit-content',
                    color: '#fff'
                  }}>
                    Top {card.limit}
                  </span>
                  <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', marginTop: '6px' }}>{card.title}</h3>
                  <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: '1.4', marginTop: '4px' }}>
                    {card.desc}
                  </p>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  color: '#fff',
                  zIndex: 2
                }}>
                  <span>View Chart Details</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. RECENT LISTEN HISTORY (LOCAL) */}
      {history.length > 0 && (
        <section>
          <h2 style={{ fontSize: '22px', marginBottom: '16px' }}>Recently Played</h2>
          <div className="grid-container">
            {history.map((track) => (
              <div 
                key={track._id} 
                className="song-card"
                onClick={() => playTrack(track, history)}
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
                
                {/* Clickable Artist Profile Link */}
                <div 
                  className="song-card-artist"
                  style={{ textDecoration: 'underline', color: 'var(--accent)', cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerProfileView(track.artist, track.isJamendo, track.jamendoArtistId || track.artist);
                  }}
                >
                  {track.artistName}
                </div>
                <div className="song-card-genre">{track.genre}</div>
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
                              loadUserPlaylists();
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
        </section>
      )}

      {/* 7. CORE MUSIC POOL LISTINGS */}
      <section>
        <h2 style={{ fontSize: '22px', marginBottom: '16px' }}>Trending Uploads</h2>
        
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <div className="spinner"></div>
          </div>
        ) : tracks.length === 0 ? (
          <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Music className="w-12 h-12 text-accent" style={{ margin: '0 auto 16px auto', opacity: 0.6 }} />
            <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '8px' }}>No Songs Uploaded Yet</h3>
            <p style={{ fontSize: '14px', marginBottom: '16px' }}>Be the first creator to upload a song directly inside Musico!</p>
            <button className="btn btn-primary" onClick={() => setActiveView('upload')}>
              Upload Your First Track
            </button>
          </div>
        ) : (
          <div className="grid-container">
            {tracks.slice(0, 10).map((track) => (
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
                
                {/* Clickable Artist Profile Link */}
                <div 
                  className="song-card-artist"
                  style={{ textDecoration: 'underline', color: 'var(--accent)', cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerProfileView(track.artist, track.isJamendo, track.jamendoArtistId || track.artist);
                  }}
                >
                  {track.artistName}
                </div>
                <div className="song-card-genre">{track.genre}</div>
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
                              loadUserPlaylists();
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

      {/* 8. QUICK SEARCH GENRE CATEGORIES */}
      <section>
        <h2 style={{ fontSize: '22px', marginBottom: '16px' }}>Browse Genres</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
          {genresList.map((g, idx) => (
            <div
              key={idx}
              style={{
                position: 'relative',
                height: '110px',
                borderRadius: '12px',
                padding: '16px',
                overflow: 'hidden',
                cursor: 'pointer',
                backgroundColor: g.color,
                boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                transition: 'transform var(--transition-fast)'
              }}
              onClick={() => {
                setSearchGenre(g.name);
                setActiveView('search');
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <h3 style={{ fontSize: '18px', color: '#ffffff', fontWeight: '800' }}>{g.name}</h3>
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

    </div>
  );
};

export default HomeView;
