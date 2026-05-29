import React, { createContext, useState, useEffect, useRef } from 'react';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // --- Auth State ---
  const [isInitializingAuth, setIsInitializingAuth] = useState(true);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('musico_user');
    if (saved) {
      const u = JSON.parse(saved);
      return { ...u, isPremium: true };
    }
    return null;
  });
  const [token, setToken] = useState(() => {
    return localStorage.getItem('musico_token') || '';
  });

  // --- UI Navigation State ---
  const [activeView, setActiveView] = useState(() => {
    // Initialize activeView from the current URL to prevent flash/redirect on refresh
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.startsWith('/pages/')) {
        return path.substring(7);
      }
    }
    return 'home';
  });
  const [activeProfileId, setActiveProfileId] = useState(null);
  const [toast, setToast] = useState(null);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('musico_theme') || 'system';
  });

  // --- Audio Player State ---
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(-1);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState('none'); // 'none', 'one', 'all'
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('musico_volume');
    return saved ? parseFloat(saved) : 0.8;
  });
  const [muted, setMuted] = useState(false);
  const [history, setHistory] = useState([]);

  // --- Geolocation State ---
  const [userLocation, setUserLocation] = useState({ city: 'Unknown', country: 'Unknown' });

  // --- Ad Interruptions State ---
  const [playCounter, setPlayCounter] = useState(0);
  const [adActive, setAdActive] = useState(false);
  const [adCountdown, setAdCountdown] = useState(5);
  const [interruptedTrack, setInterruptedTrack] = useState(null);
  const [interruptedQueue, setInterruptedQueue] = useState([]);
  const [interruptedIndex, setInterruptedIndex] = useState(-1);

  // --- Playlist Details State ---
  const [activePlaylistId, setActivePlaylistId] = useState(null);
  const [activeChart, setActiveChart] = useState(null); // { id, title, scope, limit, gradient }
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [searchGenre, setSearchGenre] = useState('All');

  // --- Lyrics Visual Drawer State ---
  const [showLyrics, setShowLyrics] = useState(false);

  // Audio HTML5 Object Ref
  const audioRef = useRef(null);

  // API base path
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // --- Initialization & Sync ---
  useEffect(() => {
    const initializeAuth = async () => {
      if (token) {
        try {
          const res = await fetch(`${API_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const fetchedUser = await res.json();
            setUser({ ...fetchedUser, isPremium: true });
            localStorage.setItem('musico_user', JSON.stringify(fetchedUser));
          } else {
            // Token is invalid or expired
            setToken('');
            setUser(null);
            localStorage.removeItem('musico_token');
            localStorage.removeItem('musico_user');
          }
        } catch (err) {
          console.error('Initial auth check failed', err);
        }
      }
      setIsInitializingAuth(false);
    };

    initializeAuth();
  }, []);

  // --- Geolocation Loader (LocationIQ Reverse Geocoder) ---
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const liqToken = import.meta.env.VITE_LOCATIONIQ_ACCESS_TOKEN || 'pk.e31e6705bd87772aa6b6ab21a599c867';
            const res = await fetch(`https://us1.locationiq.com/v1/reverse?key=${liqToken}&lat=${latitude}&lon=${longitude}&format=json`);
            if (res.ok) {
              const data = await res.json();
              const address = data.address || {};
              const city = address.city || address.town || address.village || address.municipality || 'Unknown';
              const country = address.country || 'Unknown';
              setUserLocation({ city, country });
              console.log(`Geocoded location resolved successfully: ${city}, ${country}`);
            }
          } catch (err) {
            console.error('LocationIQ reverse geocoding failed:', err);
          }
        },
        (err) => {
          console.warn('Geolocation access failed or blocked:', err.message);
        }
      );
    }
  }, []);

  // --- Effects ---
  
  // Theme Manager
  useEffect(() => {
    const root = window.document.body;
    root.classList.remove('theme-light', 'theme-dark');
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(`theme-${systemTheme}`);
    } else {
      root.classList.add(`theme-${theme}`);
    }
    localStorage.setItem('musico_theme', theme);
  }, [theme]);

  // Sync volume state with HTML5 audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = muted ? 0 : volume;
    }
    localStorage.setItem('musico_volume', volume.toString());
  }, [volume, muted]);

  // Audio state syncing effects
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      
      // Auto-play when audio loading completes
      audioRef.current.addEventListener('canplay', () => {
        if (isPlaying) {
          audioRef.current.play().catch(err => {
            console.warn('Playback interrupted:', err);
            setIsPlaying(false);
          });
        }
      });

      // Track playback ending handling
      audioRef.current.addEventListener('ended', () => {
        handleTrackEnded();
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // --- Load User Playlists globally on demand ---
  const loadUserPlaylists = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/playlists/my-playlists`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUserPlaylists(data);
      }
    } catch (err) {
      console.error('Error loading user playlists in context:', err);
    }
  };

  useEffect(() => {
    if (token) {
      loadUserPlaylists();
    } else {
      setUserPlaylists([]);
    }
  }, [token]);

  // --- Ad countdown timer effect ---
  useEffect(() => {
    let timer;
    if (adActive) {
      if (adCountdown > 0) {
        timer = setTimeout(() => {
          setAdCountdown(prev => prev - 1);
        }, 1000);
      } else {
        // Ad complete! Resume standard track playback
        setAdActive(false);
        if (interruptedTrack) {
          setCurrentTrack(interruptedTrack);
          setQueue(interruptedQueue);
          setQueueIndex(interruptedIndex);
          setIsPlaying(true);
          
          // Log play analytics for standard track
          fetch(`${API_URL}/tracks/${interruptedTrack._id}/play`, { 
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              ...(token && { 'Authorization': `Bearer ${token}` })
            },
            body: JSON.stringify({ 
              city: userLocation.city, 
              country: userLocation.country 
            })
          }).catch(err => console.error(err));

          setHistory(prev => {
            const filtered = prev.filter(t => t._id !== interruptedTrack._id);
            return [interruptedTrack, ...filtered].slice(0, 10);
          });
          
          setInterruptedTrack(null);
          setInterruptedQueue([]);
          setInterruptedIndex(-1);
        }
      }
    }
    return () => clearTimeout(timer);
  }, [adActive, adCountdown]);

  // Sync track URL source
  useEffect(() => {
    if (audioRef.current && currentTrack) {
      const wasPlaying = isPlaying;
      audioRef.current.src = currentTrack.audioUrl;
      audioRef.current.load();
      if (wasPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      }
    }
  }, [currentTrack]);

  // Sync HTML5 play/pause methods
  useEffect(() => {
    if (audioRef.current && currentTrack) {
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  // --- UI Toast Notification Helper ---
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // --- Auth Controller Helpers ---
  const loginUser = (userData, userToken) => {
    const premiumUser = { ...userData, isPremium: true };
    setUser(premiumUser);
    setToken(userToken);
    localStorage.setItem('musico_user', JSON.stringify(premiumUser));
    localStorage.setItem('musico_token', userToken);
    showToast(`Welcome back, ${userData.name}!`);
  };

  const logoutUser = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('musico_user');
    localStorage.removeItem('musico_token');
    
    // Stop and clear player
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    setCurrentTrack(null);
    setIsPlaying(false);
    setQueue([]);
    setQueueIndex(-1);
    
    setActiveView('home');
    showToast('Successfully logged out!');
  };

  const updatePremiumStatus = (isPremium) => {
    if (user) {
      const updated = { ...user, isPremium: true };
      setUser(updated);
      localStorage.setItem('musico_user', JSON.stringify(updated));
    }
  };

  const updateUser = (updatedUserData) => {
    if (updatedUserData) {
      const premiumUser = { ...updatedUserData, isPremium: true };
      setUser(premiumUser);
      localStorage.setItem('musico_user', JSON.stringify(premiumUser));
    }
  };


  // Profile View Transition Trigger Helper
  const triggerProfileView = (profileId, isJamendo = false, jamendoArtistId = null) => {
    if (isJamendo && jamendoArtistId) {
      setActiveProfileId(jamendoArtistId);
    } else {
      setActiveProfileId(profileId);
    }
    setActiveView('profile');
  };

  // --- Audio Control Methods ---
  const playTrack = (track, trackList = []) => {
    if (!track) return;
    
    // Check for Ad Interruption (Bypassed - platform is 100% free)
    if (false) {
      const nextCount = playCounter + 1;
      if (nextCount >= 3) {
        // Trigger Ad Interruption
        setPlayCounter(0);
        setAdActive(true);
        setAdCountdown(5);
        setInterruptedTrack(track);
        setInterruptedQueue(trackList);
        const index = trackList.findIndex(t => t._id === track._id);
        setInterruptedIndex(index !== -1 ? index : 0);
        
        // Mute or set play source to an ad jingle/audio
        if (audioRef.current) {
          audioRef.current.src = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3'; // distinct ad jingle
          audioRef.current.load();
          audioRef.current.play().catch(err => console.log('Ad autoplay exception:', err));
        }
        setIsPlaying(true);
        showToast('Ad Interruption playing. Upgrade to Premium to stream ad-free!');
        return;
      } else {
        setPlayCounter(nextCount);
      }
    }

    // Normal play path
    fetch(`${API_URL}/tracks/${track._id}/play`, { 
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify({ 
        city: userLocation.city, 
        country: userLocation.country 
      })
    }).catch(err => console.error(err));

    setCurrentTrack(track);
    setIsPlaying(true);
    
    // If a list of tracks is supplied, update playback queue
    if (trackList && trackList.length > 0) {
      setQueue(trackList);
      const index = trackList.findIndex(t => t._id === track._id);
      setQueueIndex(index !== -1 ? index : 0);
    } else {
      setQueue([track]);
      setQueueIndex(0);
    }

    // Append to list listening history
    setHistory(prev => {
      const filtered = prev.filter(t => t._id !== track._id);
      return [track, ...filtered].slice(0, 10);
    });
  };

  const togglePlay = () => {
    if (!currentTrack) return;
    setIsPlaying(!isPlaying);
  };

  const nextTrack = () => {
    if (queue.length === 0) return;

    let nextIndex = queueIndex;
    if (repeat === 'one') {
      // Repeat current track
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => setIsPlaying(false));
      }
      return;
    }

    if (shuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else {
      nextIndex = queueIndex + 1;
      if (nextIndex >= queue.length) {
        nextIndex = repeat === 'all' ? 0 : -1;
      }
    }

    if (nextIndex !== -1) {
      setQueueIndex(nextIndex);
      setCurrentTrack(queue[nextIndex]);
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  };

  const prevTrack = () => {
    if (queue.length === 0) return;

    let prevIndex = queueIndex;
    if (audioRef.current && audioRef.current.currentTime > 3) {
      // Restart current track if played past 3 seconds
      audioRef.current.currentTime = 0;
      return;
    }

    if (shuffle) {
      prevIndex = Math.floor(Math.random() * queue.length);
    } else {
      prevIndex = queueIndex - 1;
      if (prevIndex < 0) {
        prevIndex = repeat === 'all' ? queue.length - 1 : 0;
      }
    }

    setQueueIndex(prevIndex);
    setCurrentTrack(queue[prevIndex]);
    setIsPlaying(true);
  };

  const handleTrackEnded = () => {
    nextTrack();
  };

  const toggleLike = async (trackId) => {
    if (!token) {
      showToast('Please log in to like tracks!', 'error');
      return false;
    }

    try {
      const res = await fetch(`${API_URL}/tracks/${trackId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to toggle like');
      const data = await res.json();
      
      // Update local user reference likedTracks
      const updatedUser = { ...user, likedTracks: data.likedTracks };
      setUser(updatedUser);
      localStorage.setItem('musico_user', JSON.stringify(updatedUser));
      
      showToast(data.liked ? 'Added to Liked Songs' : 'Removed from Liked Songs');
      return data.liked;
    } catch (error) {
      console.error(error);
      showToast('Error liking track', 'error');
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        API_URL,
        user,
        setUser,
        token,
        setToken,
        isInitializingAuth,
        activeView,
        setActiveView,
        activeProfileId,
        setActiveProfileId,
        triggerProfileView,
        theme,
        setTheme,
        toast,
        showToast,
        loginUser,
        logoutUser,
        updateUser,
        updatePremiumStatus,
        userLocation,
        
        playCounter,
        setPlayCounter,
        adActive,
        setAdActive,
        adCountdown,
        setAdCountdown,
        activePlaylistId,
        setActivePlaylistId,
        activeChart,
        setActiveChart,
        userPlaylists,
        setUserPlaylists,
        loadUserPlaylists,
        searchGenre,
        setSearchGenre,
        showLyrics,
        setShowLyrics,
        
        currentTrack,
        isPlaying,
        setIsPlaying,
        queue,
        queueIndex,
        shuffle,
        setShuffle,
        repeat,
        setRepeat,
        volume,
        setVolume,
        muted,
        setMuted,
        history,
        audioRef,
        
        playTrack,
        togglePlay,
        nextTrack,
        prevTrack,
        toggleLike,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
