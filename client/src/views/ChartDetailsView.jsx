import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { Play, Music, ArrowLeft, Disc, Globe, MapPin, CheckCircle, Star } from 'lucide-react';

const ChartDetailsView = () => {
  const { 
    API_URL, 
    token, 
    activeChart, 
    setActiveView, 
    playTrack, 
    currentTrack, 
    isPlaying, 
    showToast,
    userPlaylists,
    loadUserPlaylists,
    userLocation
  } = useContext(AppContext);

  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeChart) {
      fetchChartTracks();
    }
  }, [activeChart]);

  const fetchChartTracks = async () => {
    setLoading(true);
    try {
      let queryParams = [`period=week`, `scope=${activeChart.scope}`];
      if (activeChart.scope === 'local' && userLocation.city) {
        queryParams.push(`city=${encodeURIComponent(userLocation.city)}`);
      }
      
      const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
      const res = await fetch(`${API_URL}/tracks/trending${queryString}`);
      if (!res.ok) throw new Error('Failed to retrieve chart tracks');
      
      const data = await res.json();
      // Slice according to the chart limit (10, 20, 50, etc.)
      setTracks(data.slice(0, activeChart.limit));
    } catch (err) {
      console.error(err);
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayChart = () => {
    if (tracks.length === 0) {
      showToast('This chart is empty right now!', 'error');
      return;
    }
    playTrack(tracks[0], tracks);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '100px' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!activeChart) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <h3 className="text-danger">Chart not found</h3>
        <button className="btn btn-secondary" onClick={() => setActiveView('home')}>
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', animation: 'fadeIn 0.3s ease' }}>
      
      {/* Back to Home Button */}
      <div>
        <button 
          onClick={() => setActiveView('home')}
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
            transition: 'color 0.2s',
            outline: 'none'
          }}
          onMouseEnter={(e) => e.target.style.color = 'var(--text-primary)'}
          onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>
      </div>

      {/* Chart Header Card */}
      <div style={{
        display: 'flex',
        gap: '28px',
        background: activeChart.gradient || 'linear-gradient(to bottom, rgba(59, 130, 246, 0.2), rgba(7, 10, 19, 0))',
        padding: '32px',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        alignItems: 'flex-end',
        flexWrap: 'wrap',
        boxShadow: 'var(--glass-shadow)'
      }}>
        
        {/* Visual Chart Symbol */}
        <div style={{
          width: '180px',
          height: '180px',
          borderRadius: '16px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
          flexShrink: 0,
          position: 'relative',
          overflow: 'hidden'
        }}>
          {activeChart.scope === 'global' ? (
            <Globe className="w-20 h-20 text-white" style={{ opacity: 0.8, filter: 'drop-shadow(0 4px 12px rgba(59,130,246,0.3))' }} />
          ) : (
            <MapPin className="w-20 h-20 text-white" style={{ opacity: 0.8, filter: 'drop-shadow(0 4px 12px rgba(245,158,11,0.3))' }} />
          )}
          <div style={{
            position: 'absolute',
            bottom: '12px',
            right: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#fff',
            fontSize: '12px',
            fontWeight: 'bold',
            padding: '2px 8px',
            borderRadius: '20px'
          }}>
            Top {activeChart.limit}
          </div>
        </div>
        
        {/* Info Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--accent)', letterSpacing: '2px' }}>
            OFFICIAL MUSICO CHARTS
          </span>
          <h1 style={{ fontSize: '42px', fontWeight: '800', margin: 0, color: '#fff', fontFamily: 'Outfit', lineHeight: '1.1' }}>
            {activeChart.title}
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '15px', maxWidth: '500px', lineHeight: '1.5' }}>
            The most popular songs streamed {activeChart.scope === 'global' ? 'globally across the entire platform' : `locally inside ${userLocation.city}`} this week.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-primary)', fontWeight: 'bold' }}>
              <Star className="w-3.5 h-3.5 text-premium-color fill-current" /> Musico Editor
            </span>
            <span>•</span>
            <span>{tracks.length} songs</span>
            <span>•</span>
            <span>Updated hourly</span>
          </div>
        </div>

      </div>

      {/* Action buttons bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button 
          onClick={handlePlayChart}
          className="btn btn-primary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '14px 28px',
            borderRadius: '28px',
            fontSize: '15px',
            fontWeight: '700',
            background: 'var(--accent-gradient)'
          }}
        >
          <Play className="w-5 h-5 fill-current" />
          Play Chart List
        </button>
      </div>

      {/* Tracks table */}
      {tracks.length === 0 ? (
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '60px',
          textAlign: 'center',
          color: 'var(--text-secondary)'
        }}>
          <Disc className="w-12 h-12 text-accent" style={{ margin: '0 auto 16px auto', opacity: 0.5 }} />
          <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '8px' }}>Chart is empty</h3>
          <p style={{ fontSize: '14px' }}>There are no stream records recorded for this scope yet. Go ahead and play some tracks to rank them!</p>
        </div>
      ) : (
        <table className="track-table">
          <thead>
            <tr>
              <th className="table-index" style={{ width: '60px' }}>Rank</th>
              <th>Track Title</th>
              <th>Genre</th>
              <th style={{ textAlign: 'right' }}>Streams</th>
              <th style={{ width: '120px', textAlign: 'center' }}>Add to Playlist</th>
            </tr>
          </thead>
          <tbody>
            {tracks.map((track, idx) => {
              const isCurrent = currentTrack && currentTrack._id === track._id;
              
              return (
                <tr 
                  key={track._id} 
                  onClick={() => playTrack(track, tracks)}
                  style={{ 
                    cursor: 'pointer',
                    backgroundColor: isCurrent ? 'rgba(59, 130, 246, 0.05)' : undefined
                  }}
                >
                  {/* Rank Column */}
                  <td 
                    className="table-index" 
                    style={{ 
                      fontWeight: '800', 
                      fontSize: '16px',
                      color: idx === 0 ? 'var(--premium-color)' : idx === 1 ? '#cbd5e1' : idx === 2 ? '#b45309' : 'var(--text-muted)'
                    }}
                  >
                    {idx + 1}
                  </td>
                  
                  {/* Title & Info Column */}
                  <td>
                    <div className="table-track-info">
                      {track.coverUrl ? (
                        <img className="table-cover" src={track.coverUrl} alt={track.title} style={{ width: '44px', height: '44px', borderRadius: '6px', objectFit: 'cover' }} />
                      ) : (
                        <div className="table-cover" style={{ backgroundColor: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justify: 'center', width: '44px', height: '44px', borderRadius: '6px' }}>
                          <Music className="w-5 h-5 text-accent" />
                        </div>
                      )}
                      <div>
                        <div className="table-title" style={{ color: isCurrent ? 'var(--accent)' : 'var(--text-primary)' }}>
                          {track.title}
                        </div>
                        <div className="table-artist" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>{track.artistName}</span>
                          {track.isArtistVerified && (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '13px',
                              height: '13px',
                              borderRadius: '50%',
                              backgroundColor: '#3b82f6',
                              color: '#fff',
                              fontSize: '8px',
                              fontWeight: 'bold'
                            }}>
                              ✓
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  {/* Genre Column */}
                  <td className="table-genre">{track.genre}</td>
                  
                  {/* Stream count Column */}
                  <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                    {track.plays || 0}
                  </td>
                  
                  {/* Playlist select dropdown */}
                  <td style={{ width: '120px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                    {token && userPlaylists && userPlaylists.length > 0 ? (
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
                          borderRadius: '12px',
                          fontSize: '11px',
                          padding: '4px 8px',
                          cursor: 'pointer',
                          maxWidth: '110px',
                          outline: 'none'
                        }}
                      >
                        <option value="" disabled>+ Add to...</option>
                        {userPlaylists.map(pl => (
                          <option key={pl._id} value={pl._id}>{pl.name}</option>
                        ))}
                      </select>
                    ) : (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>No playlists</span>
                    )}
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

export default ChartDetailsView;
