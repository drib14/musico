import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { Play, Music, ArrowLeft, Disc3, Calendar, CheckCircle, Ticket, Heart } from 'lucide-react';

const SongDetailsView = () => {
  const { 
    API_URL, 
    currentTrack, 
    playTrack, 
    token, 
    showToast, 
    setActiveView, 
    triggerProfileView,
    toggleLike,
    user,
    userPlaylists,
    loadUserPlaylists
  } = useContext(AppContext);

  const [artistInfo, setArtistInfo] = useState(null);
  const [artistTracks, setArtistTracks] = useState([]);
  const [similarTracks, setSimilarTracks] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentTrack && currentTrack.artist) {
      fetchExtraDetails();
    }
  }, [currentTrack]);

  const fetchExtraDetails = async () => {
    setLoading(true);
    try {
      // 1. Fetch artist details, tracks, and albums
      const isJam = currentTrack.isJamendo;
      const artistUrl = isJam
        ? `${API_URL}/tracks/jamendo/artist/${currentTrack.artist}`
        : `${API_URL}/auth/users/${currentTrack.artist}`;

      const artRes = await fetch(artistUrl);
      if (artRes.ok) {
        const artData = await artRes.json();
        setArtistInfo(artData.user);
        setArtistTracks(artData.tracks?.filter(t => t._id !== currentTrack._id) || []);
        setAlbums(artData.playlists || []);
      }

      // 2. Fetch similar songs by genre
      const similarUrl = `${API_URL}/tracks?genre=${encodeURIComponent(currentTrack.genre || 'Pop')}`;
      const simRes = await fetch(similarUrl);
      if (simRes.ok) {
        const simData = await simRes.json();
        // filter out current song
        setSimilarTracks(simData.filter(t => t._id !== currentTrack._id).slice(0, 5));
      }
    } catch (err) {
      console.error('Error fetching song details page data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!currentTrack) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <Music className="w-16 h-16 text-muted" style={{ margin: '0 auto 16px auto' }} />
        <h3>No active track playing</h3>
        <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => setActiveView('home')}>
          Go to Home
        </button>
      </div>
    );
  }

  const formatDuration = (sec) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const stripHtml = (html) => {
    if (!html) return '';
    return html.replace(/<\/?[^>]+(>|$)/g, "");
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '36px', animation: 'fadeIn 0.3s ease' }}>
      
      {/* Back to Home navigation */}
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

      {/* Main Hero Card of the Song */}
      <div style={{
        display: 'flex',
        gap: '32px',
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(7, 10, 19, 0) 100%)',
        padding: '32px',
        borderRadius: '24px',
        border: '1px solid var(--border-color)',
        alignItems: 'flex-end',
        flexWrap: 'wrap',
        boxShadow: 'var(--glass-shadow)'
      }}>
        <div style={{
          width: '200px',
          height: '200px',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
          flexShrink: 0
        }}>
          {currentTrack.coverUrl ? (
            <img src={currentTrack.coverUrl} alt={currentTrack.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', backgroundColor: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Music className="w-16 h-16 text-accent" />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: '280px' }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--accent)', letterSpacing: '1.5px' }}>
            SONG DETAILS
          </span>
          <h1 style={{ fontSize: '42px', fontWeight: '800', margin: 0, color: '#fff', fontFamily: 'Outfit', lineHeight: '1.1' }}>
            {currentTrack.title}
          </h1>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
            <span 
              onClick={() => triggerProfileView(currentTrack.artist, currentTrack.isJamendo, currentTrack.artist)}
              style={{ fontSize: '16px', color: 'var(--text-primary)', fontWeight: 'bold', textDecoration: 'underline', cursor: 'pointer' }}
            >
              {currentTrack.artistName}
            </span>
            {artistInfo?.isArtistVerified && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                backgroundColor: '#3b82f6',
                color: '#fff',
                fontSize: '8px',
                fontWeight: 'bold'
              }}>
                ✓
              </span>
            )}
            <span style={{ color: 'var(--text-muted)' }}>•</span>
            <span style={{
              fontSize: '11px',
              backgroundColor: 'var(--accent-light)',
              color: 'var(--accent)',
              padding: '2px 8px',
              borderRadius: '99px',
              fontWeight: '600'
            }}>
              {currentTrack.genre || 'Unknown'}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>•</span>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{formatDuration(currentTrack.duration)}</span>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button 
              onClick={() => playTrack(currentTrack)}
              className="btn btn-primary"
              style={{ padding: '12px 28px', borderRadius: '24px', fontSize: '14px', fontWeight: 'bold' }}
            >
              <Play fill="currentColor" style={{ width: '16px', height: '16px' }} /> Play Now
            </button>
            
            {user && (
              <button 
                onClick={() => toggleLike(currentTrack._id)}
                className="btn btn-secondary"
                style={{ padding: '12px 18px', borderRadius: '24px' }}
                title="Like Track"
              >
                <Heart className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <div className="spinner"></div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
          
          {/* SECTION: OTHER TRACKS BY THIS ARTIST */}
          <section>
            <h2 style={{ fontSize: '22px', marginBottom: '16px' }}>
              Other Releases by {currentTrack.artistName}
            </h2>
            {artistTracks.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>No other songs uploaded by this artist.</div>
            ) : (
              <table className="track-table">
                <thead>
                  <tr>
                    <th className="table-index">#</th>
                    <th>Title</th>
                    <th>Genre</th>
                    <th style={{ textAlign: 'right' }}>Plays</th>
                  </tr>
                </thead>
                <tbody>
                  {artistTracks.slice(0, 5).map((track, idx) => (
                    <tr key={track._id} onClick={() => playTrack(track, artistTracks)} style={{ cursor: 'pointer' }}>
                      <td className="table-index">{idx + 1}</td>
                      <td>
                        <div className="table-track-info">
                          <img className="table-cover" src={track.coverUrl} alt={track.title} style={{ width: '36px', height: '36px', borderRadius: '4px' }} />
                          <div className="table-title">{track.title}</div>
                        </div>
                      </td>
                      <td className="table-genre">{track.genre}</td>
                      <td style={{ textAlign: 'right', color: 'var(--text-secondary)', fontWeight: 'bold' }}>{track.plays?.toLocaleString() || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {/* SECTION: UPCOMING CONCERTS */}
          {artistInfo?.concerts && artistInfo.concerts.length > 0 && (
            <section>
              <h2 style={{ fontSize: '22px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar className="w-6 h-6 text-accent" /> Upcoming Concerts & Live Events
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {artistInfo.concerts.map((c, idx) => (
                  <div 
                    key={idx}
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '16px',
                      padding: '24px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      boxShadow: 'var(--glass-shadow)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        color: 'var(--accent)',
                        backgroundColor: 'var(--accent-light)',
                        padding: '4px 10px',
                        borderRadius: '20px'
                      }}>
                        Live Tour
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'bold' }}>{c.date}</span>
                    </div>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>{c.title}</h3>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>{c.venue}</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>{c.city}</p>
                    </div>
                    <a 
                      href={`https://www.ticketmaster.com/search?q=${encodeURIComponent(currentTrack.artistName)}`}
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="btn btn-primary"
                      style={{
                        marginTop: '8px',
                        padding: '8px 16px',
                        fontSize: '13px',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        textDecoration: 'none',
                        fontWeight: 'bold'
                      }}
                    >
                      <Ticket style={{ width: '14px', height: '14px' }} /> Get Tickets
                    </a>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* SECTION: SIMILAR SONGS */}
          <section>
            <h2 style={{ fontSize: '22px', marginBottom: '16px' }}>
              More Songs Like This
            </h2>
            {similarTracks.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>No similar tracks found for this genre.</div>
            ) : (
              <div className="grid-container">
                {similarTracks.map((track) => (
                  <div 
                    key={track._id} 
                    className="song-card"
                    onClick={() => playTrack(track, similarTracks)}
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
                        triggerProfileView(track.artist, track.isJamendo, track.jamendoArtistId || track.artist);
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

        </div>
      )}
    </div>
  );
};

export default SongDetailsView;
