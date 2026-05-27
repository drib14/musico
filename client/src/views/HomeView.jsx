import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { Play, Music, Crown, Globe, MapPin, Disc, Star } from 'lucide-react';

const HomeView = () => {
  const { API_URL, playTrack, history, user, setActiveView, triggerProfileView, userLocation } = useContext(AppContext);
  
  // Trending charts states
  const [trendingTracks, setTrendingTracks] = useState([]);
  const [period, setPeriod] = useState('week'); // 'week', 'month', 'year'
  const [scope, setScope] = useState('global'); // 'global', 'local'
  const [chartsLoading, setChartsLoading] = useState(false);

  // Spotify Mainstream Global Top Charts state
  const [spotifyTracks, setSpotifyTracks] = useState([]);
  const [spotifyLoading, setSpotifyLoading] = useState(true);

  // All local pools states
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);

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

  // Load Spotify Mainstream Global Top Charts
  useEffect(() => {
    const fetchSpotifyCharts = async () => {
      setSpotifyLoading(true);
      try {
        const res = await fetch(`${API_URL}/spotify/charts?limit=6`);
        if (!res.ok) throw new Error('Failed to load Spotify global charts');
        const data = await res.json();
        setSpotifyTracks(data);
      } catch (error) {
        console.error('Error loading Spotify global charts:', error);
      } finally {
        setSpotifyLoading(false);
      }
    };
    fetchSpotifyCharts();
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

  const genresList = [
    { name: 'Pop', color: '#3B82F6', cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=150&auto=format&fit=crop' },
    { name: 'Rock', color: '#EF4444', cover: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?q=80&w=150&auto=format&fit=crop' },
    { name: 'Hip Hop', color: '#10B981', cover: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=150&auto=format&fit=crop' },
    { name: 'Lo-Fi', color: '#8B5CF6', cover: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=150&auto=format&fit=crop' },
    { name: 'Electronic', color: '#F59E0B', cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=150&auto=format&fit=crop' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
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

      {/* 2. SPOTIFY GLOBAL TOP CHARTS */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Star className="w-6 h-6" style={{ color: '#1DB954' }} />
          <h2 style={{ fontSize: '24px' }}>Mainstream Global Top Hits</h2>
          <span className="billing-badge" style={{ backgroundColor: 'rgba(29, 185, 84, 0.15)', color: '#1DB954', border: '1px solid rgba(29, 185, 84, 0.2)' }}>
            Spotify Catalog
          </span>
        </div>

        {spotifyLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <div className="spinner"></div>
          </div>
        ) : spotifyTracks.length === 0 ? (
          <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <p>Could not fetch mainstream Spotify charts. Connect backend to internet.</p>
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
                    showToast('Spotify preview audio unavailable for this track', 'error');
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
                <div className="song-card-artist" style={{ textDecoration: 'none', color: 'var(--text-secondary)', cursor: 'default' }}>
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

      {/* 3. DYNAMIC TOP CHARTS TIME PERIOD / SCOPE SWITCHARDS */}
      <section style={{ 
        backgroundColor: 'var(--bg-secondary)', 
        border: '1px solid var(--border-color)', 
        borderRadius: '16px', 
        padding: '24px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px'
        }}>
          <div>
            <h2 style={{ fontSize: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Disc className="w-6 h-6 text-accent" /> Musico Local Charts
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
              Streamed tracks sorted by play frequencies {scope === 'local' ? `in ${userLocation.city}` : 'globally'}.
            </p>
          </div>

          {/* Switchers Control Panel */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            
            {/* Scope: Global vs Local */}
            <div style={{ display: 'flex', backgroundColor: 'var(--bg-tertiary)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <button
                className={`btn ${scope === 'global' ? 'btn-primary' : ''}`}
                style={{ padding: '4px 12px', fontSize: '12px', borderRadius: '6px', background: scope !== 'global' ? 'none' : undefined, boxShadow: scope !== 'global' ? 'none' : undefined }}
                onClick={() => setScope('global')}
              >
                <Globe className="w-3.5 h-3.5" /> Global
              </button>
              <button
                className={`btn ${scope === 'local' ? 'btn-primary' : ''}`}
                style={{ padding: '4px 12px', fontSize: '12px', borderRadius: '6px', background: scope !== 'local' ? 'none' : undefined, boxShadow: scope !== 'local' ? 'none' : undefined }}
                onClick={() => setScope('local')}
                title={`Geolocated to: ${userLocation.city}`}
              >
                <MapPin className="w-3.5 h-3.5" /> Local ({userLocation.city})
              </button>
            </div>

            {/* Period: Week vs Month vs Year */}
            <div style={{ display: 'flex', backgroundColor: 'var(--bg-tertiary)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              {[
                { id: 'week', label: 'Weekly' },
                { id: 'month', label: 'Monthly' },
                { id: 'year', label: 'Yearly' }
              ].map(opt => (
                <button
                  key={opt.id}
                  className={`btn ${period === opt.id ? 'btn-primary' : ''}`}
                  style={{ padding: '4px 12px', fontSize: '12px', borderRadius: '6px', background: period !== opt.id ? 'none' : undefined, boxShadow: period !== opt.id ? 'none' : undefined }}
                  onClick={() => setPeriod(opt.id)}
                >
                  {opt.label}
                </button>
              ))}
            </div>

          </div>
        </div>

        {/* Charts lists */}
        {chartsLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '30px' }}>
            <div className="spinner"></div>
          </div>
        ) : trendingTracks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
            <Music className="w-8 h-8 text-muted" style={{ margin: '0 auto 8px auto' }} />
            <p style={{ fontSize: '13px' }}>No plays logged for this criteria yet.</p>
          </div>
        ) : (
          <table className="track-table">
            <thead>
              <tr>
                <th className="table-index">Rank</th>
                <th>Track Title</th>
                <th>Genre</th>
                <th style={{ textAlign: 'right' }}>Streams</th>
              </tr>
            </thead>
            <tbody>
              {trendingTracks.slice(0, 5).map((track, idx) => (
                <tr key={track._id} onClick={() => playTrack(track, trendingTracks)} style={{ cursor: 'pointer' }}>
                  <td className="table-index" style={{ fontWeight: '800', fontSize: '15px', color: idx === 0 ? 'var(--premium-color)' : 'var(--text-primary)' }}>
                    {idx + 1}
                  </td>
                  <td>
                    <div className="table-track-info">
                      <img className="table-cover" src={track.coverUrl} alt={track.title} />
                      <div>
                        <div className="table-title">{track.title}</div>
                        
                        {/* Clickable Artist Profile Link */}
                        <div 
                          className="table-artist" 
                          style={{ cursor: 'pointer', textDecoration: 'underline', color: 'var(--accent)' }}
                          onClick={(e) => {
                            e.stopPropagation(); // Avoid playing song on profile click
                            triggerProfileView(track.artist);
                          }}
                        >
                          {track.artistName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="table-genre">{track.genre}</td>
                  <td style={{ textAlign: 'right', fontWeight: '600', color: 'var(--text-secondary)' }}>
                    {track.periodPlays || track.plays || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* 4. RECENT LISTEN HISTORY (LOCAL) */}
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
                    if (!track.isSpotify) triggerProfileView(track.artist);
                  }}
                >
                  {track.artistName}
                </div>
                <div className="song-card-genre" style={track.isSpotify ? { backgroundColor: 'rgba(29, 185, 84, 0.12)', color: '#1DB954' } : undefined}>
                  {track.isSpotify ? 'Spotify Stream' : track.genre}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. CORE MUSIC POOL LISTINGS */}
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

      {/* 6. QUICK SEARCH GENRE CATEGORIES */}
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
              onClick={() => setActiveView('search')}
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
