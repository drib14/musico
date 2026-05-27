const axios = require('axios');

// In-memory token cache
let cachedToken = null;
let tokenExpiry = 0;

const getAccessToken = async () => {
  // Check if token exists and is valid (with 60 seconds buffer)
  if (cachedToken && Date.now() < tokenExpiry - 60 * 1000) {
    return cachedToken;
  }

  try {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('Spotify credentials are not configured in environment variables');
    }

    const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    // Request client credentials token
    const res = await axios.post(
      'https://accounts.spotify.com/api/token',
      'grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${authString}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    cachedToken = res.data.access_token;
    tokenExpiry = Date.now() + res.data.expires_in * 1000;
    
    return cachedToken;
  } catch (error) {
    console.error('Error fetching Spotify Access Token:', error.response ? error.response.data : error.message);
    throw new Error('Failed to authenticate with Spotify API');
  }
};

// @desc    Search tracks across Spotify catalog
const searchSpotifyTracks = async (query, limit = 10) => {
  try {
    const token = await getAccessToken();
    
    const res = await axios.get(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    const items = res.data.tracks.items || [];
    
    // Map Spotify items cleanly to Musico unified schema
    return items.map(item => ({
      _id: `spotify-${item.id}`,
      title: item.name,
      artist: `spotify-artist-${item.artists[0]?.id}`,
      artistName: item.artists[0]?.name || 'Unknown',
      audioUrl: item.preview_url || '', // 30s stream preview url
      coverUrl: item.album.images[0]?.url || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300&auto=format&fit=crop',
      duration: Math.round(item.duration_ms / 1000),
      genre: 'Mainstream',
      plays: item.popularity || 0,
      isSpotify: true
    }));
  } catch (error) {
    console.error('Spotify search failed:', error.response ? error.response.data : error.message);
    return []; // Return empty array on failure to prevent app crashes
  }
};

// @desc    Get Global Top Charts (fetches Today's Top Hits playlist tracks)
const getSpotifyTopCharts = async (limit = 10) => {
  try {
    const token = await getAccessToken();
    
    // Today's Top Hits playlist ID: 37i9dQZF1DXcBWIGx251wF
    const playlistId = '37i9dQZF1DXcBWIGx251wF';
    const res = await axios.get(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=${limit}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    const playlistItems = res.data.items || [];
    
    // Map tracks cleanly to Musico unified schema
    return playlistItems.map(wrapper => {
      const item = wrapper.track;
      if (!item) return null;
      return {
        _id: `spotify-${item.id}`,
        title: item.name,
        artist: `spotify-artist-${item.artists[0]?.id}`,
        artistName: item.artists[0]?.name || 'Unknown',
        audioUrl: item.preview_url || '', // 30s stream preview url
        coverUrl: item.album.images[0]?.url || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300&auto=format&fit=crop',
        duration: Math.round(item.duration_ms / 1000),
        genre: 'Top Hits',
        plays: item.popularity || 0,
        isSpotify: true
      };
    }).filter(t => t !== null);
  } catch (error) {
    console.error('Failed to load Spotify Top Charts:', error.response ? error.response.data : error.message);
    return [];
  }
};

module.exports = {
  searchSpotifyTracks,
  getSpotifyTopCharts
};
