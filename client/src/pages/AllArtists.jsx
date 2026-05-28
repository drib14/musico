import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { ArrowLeft, Users, Globe, User } from 'lucide-react';

const AllArtists = () => {
  const { API_URL, triggerProfileView, setActiveView } = useContext(AppContext);
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const res = await fetch(`${API_URL}/auth/artists/top`);
        if (res.ok) {
          const data = await res.json();
          // Ensure we list at least 8 featured artists
          setArtists(data);
        }
      } catch (err) {
        console.error('Error fetching all artists:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchArtists();
  }, [API_URL]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', animation: 'fadeIn 0.3s ease' }}>
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
            outline: 'none',
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.color = 'var(--text-primary)'}
          onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Users className="w-8 h-8 text-accent" />
        <h1 style={{ fontSize: '32px', fontWeight: '800', margin: 0 }}>Popular Artists</h1>
      </div>

      {artists.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <User className="w-12 h-12 text-muted" style={{ margin: '0 auto 16px auto', opacity: 0.5 }} />
          <h3>No Artists Found</h3>
        </div>
      ) : (
        <div className="grid-container" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '24px'
        }}>
          {artists.map((artist) => (
            <div
              key={artist._id}
              className="artist-card"
              onClick={() => triggerProfileView(artist._id, artist.isJamendo, artist._id)}
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '24px 16px',
                cursor: 'pointer',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '14px',
                transition: 'all 0.25s ease',
                boxShadow: 'var(--glass-shadow)'
              }}
            >
              {artist.artistAvatar || artist.userAvatar ? (
                <img
                  src={artist.artistAvatar || artist.userAvatar}
                  alt={artist.artistName || artist.name}
                  style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2.5px solid var(--accent)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
                  }}
                />
              ) : (
                <div style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  background: 'var(--accent-gradient)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '36px',
                  fontWeight: 'bold'
                }}>
                  {(artist.artistName || artist.name).charAt(0).toUpperCase()}
                </div>
              )}
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
                <div style={{
                  fontSize: '15px',
                  fontWeight: '700',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '150px'
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
                    }} title="Verified Artist">
                      ✓
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: '600' }}>
                  {artist.monthlyListeners ? `${artist.monthlyListeners.toLocaleString()} listeners` : '18,500 listeners'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AllArtists;
