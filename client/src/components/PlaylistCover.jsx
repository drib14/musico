import React from 'react';
import { Music } from 'lucide-react';

const PlaylistCover = ({ playlist, className, style }) => {
  // Check if playlist has a custom uploaded cover image
  const hasCustomCover = playlist && 
                         playlist.coverUrl && 
                         playlist.coverUrl !== '' && 
                         !playlist.coverUrl.includes('unsplash.com/photo-1511671782779-c97d3d27a1d4');

  if (hasCustomCover) {
    return (
      <img 
        src={playlist.coverUrl} 
        alt={playlist.name} 
        className={className} 
        style={{ width: '100%', height: '100%', objectFit: 'cover', ...style }} 
      />
    );
  }

  // Fallback covers based on tracks in playlist
  const tracks = playlist?.tracks || [];
  const tracksWithCovers = tracks.filter(t => t && t.coverUrl);

  if (tracksWithCovers.length === 0) {
    // 0 songs: centered music note icon
    return (
      <div 
        className={className} 
        style={{ 
          width: '100%', 
          height: '100%', 
          backgroundColor: 'var(--bg-tertiary)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: 'var(--text-muted)',
          borderRadius: 'inherit',
          ...style 
        }}
      >
        <Music className="w-12 h-12" style={{ width: '35%', height: '35%', strokeWidth: 1.5 }} />
      </div>
    );
  }

  if (tracksWithCovers.length < 4) {
    // 1-3 songs: render the cover of the first track
    return (
      <img 
        src={tracksWithCovers[0].coverUrl} 
        alt={playlist.name} 
        className={className} 
        style={{ width: '100%', height: '100%', objectFit: 'cover', ...style }} 
      />
    );
  }

  // 4+ songs: render a gorgeous 2x2 grid of the first 4 track covers
  return (
    <div 
      className={className} 
      style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gridTemplateRows: '1fr 1fr', 
        width: '100%', 
        height: '100%', 
        overflow: 'hidden', 
        borderRadius: 'inherit',
        ...style 
      }}
    >
      {tracksWithCovers.slice(0, 4).map((track, idx) => (
        <img 
          key={track._id || idx}
          src={track.coverUrl} 
          alt={`Track cover ${idx + 1}`} 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ))}
    </div>
  );
};

export default PlaylistCover;
