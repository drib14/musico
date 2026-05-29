import React from 'react';

const LoadingScreen = () => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#000000',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      color: '#ffffff'
    }}>
      <div className="logo-pulse-container" style={{
        width: '100px',
        height: '100px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #0070f3 0%, #0051b3 100%)', // Glossy blue preference
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 8px 32px rgba(0, 112, 243, 0.4)',
        animation: 'pulse 1.5s infinite ease-in-out'
      }}>
        <div style={{
          width: '80%',
          height: '80%',
          borderRadius: '50%',
          border: '4px solid white',
          borderRightColor: 'transparent',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 112, 243, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 20px rgba(0, 112, 243, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 112, 243, 0); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
