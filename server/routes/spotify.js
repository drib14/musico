const express = require('express');
const router = express.Router();
const { searchSpotifyTracks, getSpotifyTopCharts } = require('../utils/spotify');

// @desc    Get Spotify Global Top Charts
// @route   GET /api/spotify/charts
// @access  Public
router.get('/charts', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 12;
    const tracks = await getSpotifyTopCharts(limit);
    res.json(tracks);
  } catch (error) {
    console.error('Error fetching Spotify charts route:', error.message);
    res.status(500).json({ message: 'Failed to load Spotify global charts' });
  }
});

// @desc    Search Spotify global catalog
// @route   GET /api/spotify/search
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    const limit = req.query.limit ? parseInt(req.query.limit) : 12;
    const tracks = await searchSpotifyTracks(query, limit);
    res.json(tracks);
  } catch (error) {
    console.error('Error searching Spotify catalog route:', error.message);
    res.status(500).json({ message: 'Failed to search Spotify global catalog' });
  }
});

module.exports = router;
