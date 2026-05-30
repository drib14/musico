import React, { useEffect, useState } from 'react';

const SplashScreen = ({ fadeOut }) => {
  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#070a13',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        opacity: fadeOut ? 0 : 1,
        visibility: fadeOut ? 'hidden' : 'visible',
        transition: 'opacity 0.6s cubic-bezier(0.25, 1, 0.5, 1), visibility 0.6s ease',
        background: 'radial-gradient(circle at center, #0e172e 0%, #070a13 100%)'
      }}
    >
      <div 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: '24px',
          transform: fadeOut ? 'scale(0.95)' : 'scale(1)',
          transition: 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)'
        }}
      >
        {/* Glowing Logo Icon Wrapper */}
        <div 
          style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: 'rgba(59, 130, 246, 0.05)',
            border: '1px solid rgba(59, 130, 246, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 40px rgba(59, 130, 246, 0.15)',
            position: 'relative',
            animation: 'splash-pulse 2s infinite ease-in-out'
          }}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            style={{
              width: '44px',
              height: '44px',
              color: '#3b82f6',
              filter: 'drop-shadow(0 0 12px rgba(59, 130, 246, 0.6))'
            }}
          >
            <path d="M9 18V5l12-2v13"></path>
            <circle cx="6" cy="18" r="3"></circle>
            <circle cx="18" cy="16" r="3"></circle>
          </svg>
        </div>

        {/* Custom Text Loader */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <h1 
            style={{ 
              fontSize: '44px', 
              fontFamily: 'Outfit, sans-serif', 
              fontWeight: '900', 
              margin: 0,
              letterSpacing: '2px',
              background: 'linear-gradient(135deg, #ffffff 40%, #3b82f6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))'
            }}
          >
            Musico
          </h1>
          <span 
            style={{ 
              fontSize: '13px', 
              color: '#94a3b8', 
              textTransform: 'uppercase', 
              letterSpacing: '4px',
              opacity: 0.8,
              fontWeight: '600'
            }}
          >
            Streaming Platform
          </span>
        </div>

        {/* Pulsing soundwave loader */}
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'flex-end', 
            gap: '5px', 
            height: '32px',
            marginTop: '16px'
          }}
        >
          {[1, 2, 3, 4, 5].map((bar) => (
            <div 
              key={bar}
              style={{
                width: '4px',
                backgroundColor: '#3b82f6',
                borderRadius: '2px',
                height: '10%',
                boxShadow: '0 0 8px rgba(59, 130, 246, 0.4)',
                animation: `splash-wave 1s ease-in-out infinite alternate`,
                animationDelay: `${bar * 0.15}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Styled animation keyframes inside dynamic style tag */}
      <style>{`
        @keyframes splash-pulse {
          0% {
            transform: scale(1);
            box-shadow: 0 0 40px rgba(59, 130, 246, 0.15), inset 0 0 20px rgba(59, 130, 246, 0.05);
          }
          50% {
            transform: scale(1.05);
            box-shadow: 0 0 60px rgba(59, 130, 246, 0.3), inset 0 0 30px rgba(59, 130, 246, 0.15);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 0 40px rgba(59, 130, 246, 0.15), inset 0 0 20px rgba(59, 130, 246, 0.05);
          }
        }
        @keyframes splash-wave {
          0% { height: 10%; }
          100% { height: 100%; }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
