import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { ArrowLeft, Disc3, Disc } from 'lucide-react';
import PlaylistCover from '../components/PlaylistCover';

const AllPlaylists = () => {
  const { API_URL, setActivePlaylistId, setActiveView } = useContext(AppContext);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const res = await fetch(`${API_URL}/playlists`);
        if (res.ok) {
          const data = await res.json();
          setPlaylists(data);
        }
      } catch (err) {
        console.error('Error fetching all playlists:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlaylists();
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
        <Disc3 className="w-8 h-8 text-accent" />
        <h1 style={{ fontSize: '32px', fontWeight: '800', margin: 0 }}>Featured Playlists & Collections</h1>
      </div>

      {playlists.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Disc className="w-12 h-12 text-muted" style={{ margin: '0 auto 16px auto', opacity: 0.5 }} />
          <h3>No Playlists Found</h3>
        </div>
      ) : (
        <div className="grid-container" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '24px'
        }}>
          {playlists.map((pl) => (
            <div
              key={pl._id}
              className="song-card"
              onClick={() => {
                setActivePlaylistId(pl._id);
                setActiveView('playlist-details');
              }}
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <div className="song-card-cover-wrapper" style={{ width: '100%', aspectRatio: '1', borderRadius: '8px', overflow: 'hidden' }}>
                <PlaylistCover playlist={pl} className="song-card-cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div>
                <div className="song-card-title" style={{ fontWeight: '700', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pl.name}</div>
                <div className="song-card-artist" style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  By {pl.creator?.name || 'Musico'} • {pl.tracks?.length || 0} tracks
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AllPlaylists;
