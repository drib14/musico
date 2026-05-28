import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { ArrowLeft, Music, Disc } from 'lucide-react';
import TrackCard from '../components/TrackCard';

const AllTracks = () => {
  const { API_URL, setActiveView } = useContext(AppContext);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const res = await fetch(`${API_URL}/tracks`);
        if (res.ok) {
          const data = await res.json();
          setTracks(data);
        }
      } catch (err) {
        console.error('Error fetching all tracks:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTracks();
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
        <Music className="w-8 h-8 text-accent" />
        <h1 style={{ fontSize: '32px', fontWeight: '800', margin: 0 }}>Trending Uploads</h1>
      </div>

      {tracks.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Disc className="w-12 h-12 text-muted" style={{ margin: '0 auto 16px auto', opacity: 0.5 }} />
          <h3>No Tracks Found</h3>
        </div>
      ) : (
        <div className="grid-container" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '24px'
        }}>
          {tracks.map((track) => (
            <TrackCard key={track._id} track={track} trackList={tracks} />
          ))}
        </div>
      )}
    </div>
  );
};

export default AllTracks;
