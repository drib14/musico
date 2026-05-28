import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { Play, Music, ArrowLeft, Calendar, CheckCircle, Ticket, Heart, Globe, Facebook, Twitter, Instagram } from 'lucide-react';
import TrackCard from '../components/TrackCard';

const SongDetails = () => {
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
      const artistId = currentTrack.isJamendo 
        ? (currentTrack.jamendoArtistId || currentTrack.artist)
        : currentTrack.artist;

      const artistUrl = currentTrack.isJamendo
        ? `${API_URL}/tracks/jamendo/artist/${artistId}`
        : `${API_URL}/auth/users/${artistId}`;

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

  const isLiked = user && user.likedTracks && user.likedTracks.some(id => id === currentTrack._id);

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
                title={isLiked ? "Unlike Track" : "Like Track"}
              >
                <Heart className="w-5 h-5" style={{ fill: isLiked ? 'var(--accent)' : 'none', color: isLiked ? 'var(--accent)' : 'inherit' }} />
              </button>
            )}
          </div>

          {currentTrack.contributors && (currentTrack.contributors.mainVocalist || currentTrack.contributors.composer || currentTrack.contributors.lyricist || currentTrack.contributors.producer) && (
            <div style={{ marginTop: '24px', backgroundColor: 'var(--bg-tertiary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
              {currentTrack.contributors.mainVocalist && (
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold', marginBottom: '4px' }}>Main Vocalist</div>
                  <div
                    style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={() => {
                      // Redirect to search view
                      setActiveView('search');
                      // Wait a bit, then set search
                      setTimeout(() => {
                        const evt = new CustomEvent('setGlobalSearch', { detail: currentTrack.contributors.mainVocalist });
                        window.dispatchEvent(evt);
                      }, 100);
                    }}
                  >
                    {currentTrack.contributors.mainVocalist}
                  </div>
                </div>
              )}
              {currentTrack.contributors.composer && (
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold', marginBottom: '4px' }}>Composer</div>
                  <div
                    style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={() => {
                      setActiveView('search');
                      setTimeout(() => {
                        const evt = new CustomEvent('setGlobalSearch', { detail: currentTrack.contributors.composer });
                        window.dispatchEvent(evt);
                      }, 100);
                    }}
                  >
                    {currentTrack.contributors.composer}
                  </div>
                </div>
              )}
              {currentTrack.contributors.lyricist && (
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold', marginBottom: '4px' }}>Lyricist</div>
                  <div
                    style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={() => {
                      setActiveView('search');
                      setTimeout(() => {
                        const evt = new CustomEvent('setGlobalSearch', { detail: currentTrack.contributors.lyricist });
                        window.dispatchEvent(evt);
                      }, 100);
                    }}
                  >
                    {currentTrack.contributors.lyricist}
                  </div>
                </div>
              )}
              {currentTrack.contributors.producer && (
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold', marginBottom: '4px' }}>Producer</div>
                  <div
                    style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={() => {
                      setActiveView('search');
                      setTimeout(() => {
                        const evt = new CustomEvent('setGlobalSearch', { detail: currentTrack.contributors.producer });
                        window.dispatchEvent(evt);
                      }, 100);
                    }}
                  >
                    {currentTrack.contributors.producer}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <div className="spinner"></div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
          
          {/* SECTION: OTHER TRACKS BY THIS ARTIST */}
          {artistTracks.length > 0 && (
            <section>
              <h2 style={{ fontSize: '22px', marginBottom: '16px' }}>
                Other Releases by {currentTrack.artistName}
              </h2>
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
            </section>
          )}

          {/* SPOTIFY STYLE ABOUT THE ARTIST SECTION WITH SOCIAL LINKS */}
          {artistInfo && (
            <section style={{ animation: 'fadeIn 0.3s ease' }}>
              <h2 style={{ fontSize: '22px', marginBottom: '16px' }}>About the Artist</h2>
              <div 
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  boxShadow: 'var(--glass-shadow)',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '0',
                  alignItems: 'stretch'
                }}
              >
                {(artistInfo.artistAvatar || artistInfo.userAvatar) && (
                  <div 
                    style={{
                      width: '100%',
                      minHeight: '220px',
                      background: `url(${artistInfo.artistAvatar || artistInfo.userAvatar}) center/cover no-repeat`,
                      borderRight: '1px solid var(--border-color)'
                    }}
                  />
                )}
                <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--accent)', letterSpacing: '1px' }}>
                      Independent Creator Profile
                    </span>
                    {artistInfo.isArtistVerified && (
                      <span style={{
                        backgroundColor: 'rgba(59, 130, 246, 0.15)',
                        color: '#3b82f6',
                        padding: '2px 8px',
                        borderRadius: '99px',
                        fontSize: '10px',
                        fontWeight: '700'
                      }}>
                        Verified
                      </span>
                    )}
                  </div>
                  
                  <h3 style={{ fontSize: '24px', fontFamily: 'Outfit', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                    {artistInfo.artistName || artistInfo.name}
                  </h3>
                  
                  {artistInfo.artistBio && (
                    <p style={{ 
                      color: 'var(--text-secondary)', 
                      fontSize: '13.5px', 
                      lineHeight: '1.6', 
                      margin: 0,
                      maxHeight: '120px',
                      overflowY: 'auto'
                    }}>
                      {stripHtml(artistInfo.artistBio)}
                    </p>
                  )}

                  {/* Populated Social Links */}
                  {(artistInfo.facebook || artistInfo.twitter || artistInfo.instagram || artistInfo.website) && (
                    <div style={{ display: 'flex', gap: '10px', marginTop: '8px', alignItems: 'center' }}>
                      {artistInfo.website && (
                        <a href={artistInfo.website} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} title="Website">
                          <Globe style={{ width: '16px', height: '16px' }} />
                        </a>
                      )}
                      {artistInfo.facebook && (
                        <a href={artistInfo.facebook.startsWith('http') ? artistInfo.facebook : `https://facebook.com/${artistInfo.facebook}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} title="Facebook">
                          <Facebook style={{ width: '16px', height: '16px' }} />
                        </a>
                      )}
                      {artistInfo.twitter && (
                        <a href={artistInfo.twitter.startsWith('http') ? artistInfo.twitter : `https://twitter.com/${artistInfo.twitter}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} title="Twitter">
                          <Twitter style={{ width: '16px', height: '16px' }} />
                        </a>
                      )}
                      {artistInfo.instagram && (
                        <a href={artistInfo.instagram.startsWith('http') ? artistInfo.instagram : `https://instagram.com/${artistInfo.instagram}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} title="Instagram">
                          <Instagram style={{ width: '16px', height: '16px' }} />
                        </a>
                      )}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '20px', fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                    <span><strong>{artistInfo.monthlyListeners?.toLocaleString() || 0}</strong> Listeners</span>
                    <span>•</span>
                    <span><strong>{artistInfo.totalPlays?.toLocaleString() || 0}</strong> Plays</span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* SECTION: UPCOMING CONCERTS */}
          {artistInfo?.concerts && artistInfo.concerts.length > 0 && (
            <section>
              <h2 style={{ fontSize: '22px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar className="w-6 h-6 text-accent" /> Upcoming Concerts & Live Events
              </h2>
              <div className="concert-grid-container">
                {artistInfo.concerts.map((c, idx) => (
                  <div 
                    key={idx}
                    className="concert-card"
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

          {/* SECTION: CONTRIBUTORS */}
          {currentTrack.contributors && (currentTrack.contributors.mainVocalist || currentTrack.contributors.composer || currentTrack.contributors.lyricist || currentTrack.contributors.producer) && (
            <section style={{ marginTop: '24px' }}>
              <h3 style={{ fontSize: '18px', marginBottom: '12px', color: 'var(--text-primary)', fontFamily: 'Outfit', fontWeight: '800' }}>Contributors</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                {currentTrack.contributors.mainVocalist && (
                  <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}><span style={{ color: 'var(--text-muted)', fontSize: '12px', display: 'block' }}>Main Vocalist</span><span style={{ fontSize: '14px', fontWeight: '600' }}>{currentTrack.contributors.mainVocalist}</span></div>
                )}
                {currentTrack.contributors.composer && (
                  <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}><span style={{ color: 'var(--text-muted)', fontSize: '12px', display: 'block' }}>Composer</span><span style={{ fontSize: '14px', fontWeight: '600' }}>{currentTrack.contributors.composer}</span></div>
                )}
                {currentTrack.contributors.lyricist && (
                  <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}><span style={{ color: 'var(--text-muted)', fontSize: '12px', display: 'block' }}>Lyricist</span><span style={{ fontSize: '14px', fontWeight: '600' }}>{currentTrack.contributors.lyricist}</span></div>
                )}
                {currentTrack.contributors.producer && (
                  <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}><span style={{ color: 'var(--text-muted)', fontSize: '12px', display: 'block' }}>Producer</span><span style={{ fontSize: '14px', fontWeight: '600' }}>{currentTrack.contributors.producer}</span></div>
                )}
              </div>
            </section>
          )}

          {/* SECTION: MUSIC INFO */}
          {currentTrack.musicinfo && (currentTrack.musicinfo.vocalinstrumental || currentTrack.musicinfo.gender || currentTrack.musicinfo.speed || (currentTrack.musicinfo.tags && (currentTrack.musicinfo.tags.genres?.length > 0 || currentTrack.musicinfo.tags.instruments?.length > 0))) && (
            <section style={{ marginTop: '24px' }}>
              <h3 style={{ fontSize: '18px', marginBottom: '12px', color: 'var(--text-primary)', fontFamily: 'Outfit', fontWeight: '800' }}>Music Info</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                {currentTrack.musicinfo.vocalinstrumental && (
                  <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}><span style={{ color: 'var(--text-muted)', fontSize: '12px', display: 'block' }}>Type</span><span style={{ fontSize: '14px', fontWeight: '600' }}>{currentTrack.musicinfo.vocalinstrumental === 'vocal' ? 'Vocal' : 'Instrumental'}</span></div>
                )}
                {currentTrack.musicinfo.gender && (
                  <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}><span style={{ color: 'var(--text-muted)', fontSize: '12px', display: 'block' }}>Gender</span><span style={{ fontSize: '14px', fontWeight: '600', textTransform: 'capitalize' }}>{currentTrack.musicinfo.gender}</span></div>
                )}
                {currentTrack.musicinfo.speed && (
                  <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}><span style={{ color: 'var(--text-muted)', fontSize: '12px', display: 'block' }}>Speed (BPM)</span><span style={{ fontSize: '14px', fontWeight: '600' }}>{currentTrack.musicinfo.speed}</span></div>
                )}
                {currentTrack.musicinfo.tags?.instruments?.length > 0 && (
                  <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}><span style={{ color: 'var(--text-muted)', fontSize: '12px', display: 'block' }}>Instruments</span><span style={{ fontSize: '14px', fontWeight: '600', textTransform: 'capitalize' }}>{currentTrack.musicinfo.tags.instruments.join(', ')}</span></div>
                )}
              </div>
            </section>
          )}
          {/* SECTION: SIMILAR SONGS */}
          {similarTracks.length > 0 && (
            <section>
              <h2 style={{ fontSize: '22px', marginBottom: '16px' }}>
                More Songs Like This
              </h2>
              <div className="grid-container carousel-desktop">
                {similarTracks.map((track) => (
                  <TrackCard key={track._id} track={track} trackList={similarTracks} />
                ))}
              </div>
            </section>
          )}

        </div>
      )}
    </div>
  );
};

export default SongDetails;

