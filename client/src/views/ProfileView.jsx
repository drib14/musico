import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { Music, Play, Crown, Calendar, Sparkles, CheckCircle } from 'lucide-react';

const ProfileView = () => {
  const { API_URL, activeProfileId, playTrack, showToast } = useContext(AppContext);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeProfileId) {
      fetchProfileDetails();
    }
  }, [activeProfileId]);

  const fetchProfileDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/users/${activeProfileId}`);
      if (!res.ok) throw new Error('Failed to load profile details');
      const data = await res.json();
      setProfileData(data);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!profileData || !profileData.user) {
    return (
      <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
        <Music className="w-16 h-16 text-accent" style={{ margin: '0 auto 16px auto', opacity: 0.6 }} />
        <h3>User Profile Not Found</h3>
      </div>
    );
  }

  const { user, tracks, playlists } = profileData;
  const joinDate = new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long' });

  const hasBanner = user.artistBanner && user.artistBanner.trim().length > 0;
  const bannerBackground = hasBanner 
    ? `linear-gradient(rgba(7, 10, 19, 0.45), rgba(7, 10, 19, 0.85)), url(${user.artistBanner}) center/cover no-repeat`
    : 'linear-gradient(135deg, rgba(13, 21, 39, 0.95) 0%, rgba(59, 130, 246, 0.2) 100%)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* 1. LARGE PREMIUM ARTIST BANNER */}
      <div 
        style={{
          background: bannerBackground,
          borderRadius: '20px',
          padding: '48px 40px',
          display: 'flex',
          alignItems: 'center',
          gap: '28px',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--glass-shadow)',
          position: 'relative',
          overflow: 'hidden',
          minHeight: '220px'
        }}
      >
        {user.artistAvatar || user.userAvatar ? (
          <img 
            src={user.artistAvatar || user.userAvatar} 
            alt={user.artistName || user.name} 
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '3px solid var(--accent)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
              flexShrink: 0
            }}
          />
        ) : (
          <div 
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: 'var(--accent-gradient)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '48px',
              fontFamily: 'Outfit',
              fontWeight: '800',
              boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)',
              flexShrink: 0
            }}
          >
            {(user.artistName || user.name).charAt(0).toUpperCase()}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', zIndex: '5' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {user.isArtistVerified ? (
              <span 
                className="user-badge" 
                style={{ 
                  fontSize: '11px', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '4px', 
                  margin: 0, 
                  backgroundColor: 'rgba(59, 130, 246, 0.25)', 
                  color: '#3b82f6',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  boxShadow: '0 2px 8px rgba(59, 130, 246, 0.15)'
                }}
              >
                <CheckCircle className="w-3.5 h-3.5 fill-current" /> Verified Artist
              </span>
            ) : user.isPremium ? (
              <span className="user-badge" style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', margin: 0 }}>
                <Crown style={{ width: '12px', height: '12px' }} /> Premium Artist
              </span>
            ) : (
              <span className="user-badge" style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'var(--accent-light)', color: 'var(--accent)', margin: 0 }}>
                <Sparkles style={{ width: '12px', height: '12px' }} /> Creator
              </span>
            )}
          </div>

          <h1 style={{ 
            fontSize: '42px', 
            fontFamily: 'Outfit', 
            fontWeight: '800', 
            lineHeight: '1.1',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#fff'
          }}>
            {user.artistName || user.name}
            {user.isArtistVerified && (
              <span 
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: '#3b82f6',
                  color: '#ffffff',
                  fontSize: '12px',
                  boxShadow: '0 2px 8px rgba(59, 130, 246, 0.4)'
                }}
                title="Verified Artist check badge"
              >
                ✓
              </span>
            )}
          </h1>
          
          <div style={{ display: 'flex', gap: '20px', fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar className="w-4 h-4 text-muted" /> Joined {joinDate}
            </span>
            <span>•</span>
            <span><strong>{tracks.length}</strong> Songs uploaded</span>
            <span>•</span>
            <span><strong>{playlists.length}</strong> Playlists created</span>
          </div>

        </div>

        {/* Decorative background element */}
        <div style={{ position: 'absolute', right: '-20px', bottom: '-40px', fontSize: '180px', fontWeight: '800', color: 'rgba(59, 130, 246, 0.03)', pointerEvents: 'none', fontFamily: 'Outfit' }}>
          CREATOR
        </div>
      </div>

      {/* 1.5 SPOTIFY ABOUT / BIOGRAPHY SECTION */}
      {user.artistBio && (
        <section 
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: 'var(--glass-shadow)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '0',
            alignItems: 'stretch',
            animation: 'fadeIn 0.3s ease'
          }}
        >
          {user.artistAvatar && (
            <div 
              style={{
                width: '100%',
                minHeight: '250px',
                background: `url(${user.artistAvatar}) center/cover no-repeat`,
                borderRight: '1px solid var(--border-color)'
              }}
            />
          )}
          <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '14px', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--accent)', letterSpacing: '1px' }}>
                Artist Biography
              </span>
              {user.isArtistVerified && (
                <span style={{
                  backgroundColor: 'rgba(59, 130, 246, 0.15)',
                  color: '#3b82f6',
                  padding: '2px 8px',
                  borderRadius: '99px',
                  fontSize: '10px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  Official Verified Check Badge
                </span>
              )}
            </div>
            
            <h3 style={{ fontSize: '24px', fontFamily: 'Outfit', fontWeight: '800', margin: 0 }}>
              About {user.artistName || user.name}
            </h3>
            
            <p style={{ 
              color: 'var(--text-secondary)', 
              fontSize: '14px', 
              lineHeight: '1.7', 
              margin: 0,
              whiteSpace: 'pre-wrap'
            }}>
              {user.artistBio}
            </p>
            
            {/* Spotify Monthly Listeners stats */}
            <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
              <span><strong>{user.monthlyListeners?.toLocaleString() || 0}</strong> Monthly Listeners</span>
              <span>•</span>
              <span><strong>{user.totalPlays?.toLocaleString() || 0}</strong> Lifetime Streams</span>
            </div>
          </div>
        </section>
      )}

      {/* 2. UPLOADED TRACKS LIST */}
      <section>
        <h2 style={{ fontSize: '22px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          Uploaded Songs
        </h2>
        
        {tracks.length === 0 ? (
          <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Music className="w-10 h-10 text-muted" style={{ margin: '0 auto 12px auto' }} />
            <p>This creator has not uploaded any tracks yet.</p>
          </div>
        ) : (
          <table className="track-table">
            <thead>
              <tr>
                <th className="table-index">#</th>
                <th>Title</th>
                <th>Genre</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {tracks.map((track, idx) => (
                <tr key={track._id} onClick={() => playTrack(track, tracks)} style={{ cursor: 'pointer' }}>
                  <td className="table-index">{idx + 1}</td>
                  <td>
                    <div className="table-track-info">
                      {track.coverUrl ? (
                        <img className="table-cover" src={track.coverUrl} alt={track.title} />
                      ) : (
                        <div className="table-cover" style={{ backgroundColor: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justify: 'center' }}>
                          <Music className="w-5 h-5 text-accent" />
                        </div>
                      )}
                      <div>
                        <div className="table-title">{track.title}</div>
                        <div className="table-artist" style={{ color: 'var(--text-muted)' }}>{track.artistName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="table-genre">{track.genre}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn-icon" onClick={(e) => { e.stopPropagation(); playTrack(track, tracks); }}>
                      <Play fill="currentColor" className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* 3. PUBLIC PLAYLISTS */}
      <section>
        <h2 style={{ fontSize: '22px', marginBottom: '16px' }}>Public Playlists</h2>
        
        {playlists.length === 0 ? (
          <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <p>This user has no public playlists.</p>
          </div>
        ) : (
          <div className="grid-container">
            {playlists.map((pl) => (
              <div
                key={pl._id}
                className="song-card"
              >
                <div className="song-card-cover-wrapper">
                  {pl.coverUrl ? (
                    <img className="song-card-cover" src={pl.coverUrl} alt={pl.name} />
                  ) : (
                    <div style={{ backgroundColor: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justify: 'center', width: '100%', height: '100%' }}>
                      <Music className="w-12 h-12 text-accent" />
                    </div>
                  )}
                </div>
                <div className="song-card-title">{pl.name}</div>
                <div className="song-card-artist">{pl.tracks.length} songs</div>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
};

export default ProfileView;
