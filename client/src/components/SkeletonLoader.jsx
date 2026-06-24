import React from 'react';

const SkeletonLoader = ({ type = 'grid', count = 6 }) => {
  const pulseStyle = {
    animation: 'skeleton-pulse 1.5s ease-in-out infinite'
  };

  const renderSkeleton = () => {
    switch (type) {
      case 'grid':
        return (
          <div className="grid-container" style={{ animation: 'fadeIn 0.3s ease' }}>
            {Array.from({ length: count }).map((_, idx) => (
              <div 
                key={idx}
                className="song-card"
                style={{
                  ...pulseStyle,
                  cursor: 'default',
                  borderColor: 'var(--border-color)',
                  backgroundColor: 'var(--bg-secondary)',
                  opacity: 0.6
                }}
              >
                {/* Image cover placeholder */}
                <div 
                  style={{
                    width: '100%',
                    aspectRatio: '1',
                    borderRadius: '10px',
                    backgroundColor: 'var(--bg-tertiary)',
                    marginBottom: '14px'
                  }}
                />
                {/* Title line placeholder */}
                <div 
                  style={{
                    width: '70%',
                    height: '16px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--bg-tertiary)',
                    marginBottom: '8px'
                  }}
                />
                {/* Subtitle line placeholder */}
                <div 
                  style={{
                    width: '40%',
                    height: '12px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--bg-tertiary)'
                  }}
                />
              </div>
            ))}
          </div>
        );

      case 'table':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', animation: 'fadeIn 0.3s ease' }}>
            {/* Header row placeholder */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', paddingLeft: '16px', paddingRight: '16px' }}>
              <div style={{ width: '40px', height: '14px', borderRadius: '4px', backgroundColor: 'var(--bg-tertiary)', opacity: 0.4 }} />
              <div style={{ flex: 1, height: '14px', borderRadius: '4px', backgroundColor: 'var(--bg-tertiary)', marginLeft: '12px', opacity: 0.4 }} />
              <div style={{ width: '120px', height: '14px', borderRadius: '4px', backgroundColor: 'var(--bg-tertiary)', opacity: 0.4 }} />
            </div>
            {/* Rows */}
            {Array.from({ length: count }).map((_, idx) => (
              <div 
                key={idx}
                style={{
                  ...pulseStyle,
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid transparent',
                  opacity: 0.6
                }}
              >
                {/* Index */}
                <div style={{ width: '24px', height: '14px', borderRadius: '4px', backgroundColor: 'var(--bg-tertiary)' }} />
                {/* Cover and details */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, marginLeft: '16px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '6px', backgroundColor: 'var(--bg-tertiary)', flexShrink: 0 }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', maxWidth: '200px' }}>
                    <div style={{ width: '80%', height: '14px', borderRadius: '4px', backgroundColor: 'var(--bg-tertiary)' }} />
                    <div style={{ width: '50%', height: '10px', borderRadius: '4px', backgroundColor: 'var(--bg-tertiary)' }} />
                  </div>
                </div>
                {/* Genre placeholder */}
                <div style={{ width: '80px', height: '14px', borderRadius: '4px', backgroundColor: 'var(--bg-tertiary)' }} />
                {/* Action placeholder */}
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)', marginLeft: 'auto' }} />
              </div>
            ))}
          </div>
        );

      case 'detail':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', width: '100%', animation: 'fadeIn 0.3s ease' }}>
            {/* Banner block placeholder */}
            <div 
              style={{
                ...pulseStyle,
                background: 'linear-gradient(135deg, var(--bg-tertiary) 0%, rgba(25, 33, 56, 0.5) 100%)',
                borderRadius: '20px',
                padding: '48px 40px',
                display: 'flex',
                alignItems: 'center',
                gap: '28px',
                border: '1px solid var(--border-color)',
                minHeight: '220px',
                opacity: 0.7
              }}
            >
              {/* Cover Art placeholder */}
              <div 
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '3px solid var(--border-color)',
                  flexShrink: 0
                }}
              />
              {/* Text metadata placeholder */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                <div style={{ width: '100px', height: '18px', borderRadius: '4px', backgroundColor: 'rgba(255, 255, 255, 0.08)' }} />
                <div style={{ width: '50%', height: '38px', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
                <div style={{ width: '30%', height: '14px', borderRadius: '4px', backgroundColor: 'rgba(255, 255, 255, 0.05)' }} />
              </div>
            </div>
            {/* Sub content skeletal table */}
            <SkeletonLoader type="table" count={4} />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {renderSkeleton()}
      
      {/* Styles injector for premium skeleton animation keyframes */}
      <style>{`
        @keyframes skeleton-pulse {
          0% { opacity: 0.45; }
          50% { opacity: 0.75; }
          100% { opacity: 0.45; }
        }
      `}</style>
    </>
  );
};

export default SkeletonLoader;
