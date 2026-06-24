import React from 'react';

const LoadingScreen = () => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'var(--bg-primary)',
      display: 'flex',
      zIndex: 9999,
      padding: '24px',
      gap: '24px'
    }}>
      {/* Sidebar Skeleton */}
      <div style={{ width: '240px', display: 'flex', flexDirection: 'column', gap: '20px', borderRight: '1px solid var(--border-color)', paddingRight: '20px' }}>
        <div className="skeleton-box" style={{ width: '120px', height: '40px', borderRadius: '8px' }}></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton-box" style={{ width: '100%', height: '24px', borderRadius: '4px' }}></div>)}
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '30px' }}>
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="skeleton-box" style={{ width: '150px', height: '30px', borderRadius: '6px' }}></div>
          <div className="skeleton-box" style={{ width: '40px', height: '40px', borderRadius: '50%' }}></div>
        </div>

        {/* Hero Section */}
        <div className="skeleton-box" style={{ width: '100%', height: '280px', borderRadius: '24px' }}></div>

        {/* Grid Section */}
        <div style={{ display: 'flex', gap: '20px' }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="skeleton-box" style={{ width: '180px', height: '180px', borderRadius: '12px' }}></div>
              <div className="skeleton-box" style={{ width: '140px', height: '16px', borderRadius: '4px' }}></div>
              <div className="skeleton-box" style={{ width: '100px', height: '12px', borderRadius: '4px' }}></div>
            </div>
          ))}
        </div>
      </div>

      {/* Styles for dynamic shimmer */}
      <style>{`
        .skeleton-box {
          background: linear-gradient(90deg, var(--bg-tertiary) 25%, var(--bg-secondary) 50%, var(--bg-tertiary) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite linear;
        }

        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        @media (max-width: 768px) {
          .skeleton-box:nth-child(n+3) { display: none; }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
