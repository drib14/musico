const express = require('express');
const router = express.Router();
const Playlist = require('../models/Playlist');
const Track = require('../models/Track');
const { protect } = require('../middleware/authMiddleware');
const { getSpotifyNewReleases, getSpotifyAlbum, getSpotifyTrack, getSpotifyPlaylist } = require('../utils/spotifyService');

// @desc    Create new playlist
// @route   POST /api/playlists
// @access  Private
router.post('/', protect, async (req, res) => {
  const { name, description, isPublic, coverUrl } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Playlist name is required' });
  }

  try {
    const playlist = await Playlist.create({
      name,
      description: description || '',
      creator: req.user._id,
      isPublic: isPublic !== undefined ? isPublic : true,
      coverUrl: coverUrl || '',
      tracks: [],
    });

    res.status(201).json(playlist);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating playlist' });
  }
});

// @desc    Get all public playlists
// @route   GET /api/playlists
// @access  Public
router.get('/', async (req, res) => {
  const limit = parseInt(req.query.limit) || 16;
  const offset = parseInt(req.query.offset) || 0;

  try {
    // 1. Fetch local public playlists with pagination
    const localPlaylists = await Playlist.find({ isPublic: true })
      .populate('creator', 'name')
      .populate({ path: 'tracks', select: 'coverUrl' })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);

    // 2. Fetch popular albums from Spotify
    let spotifyAlbums = [];
    try {
      spotifyAlbums = await getSpotifyNewReleases(limit, offset);
    } catch (err) {
      console.error('Error fetching Spotify albums for homepage:', err);
    }

    const mergedPlaylists = [...localPlaylists, ...spotifyAlbums];
    res.json(mergedPlaylists);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving playlists' });
  }
});

// @desc    Get user's personal playlists
// @route   GET /api/playlists/my-playlists
// @access  Private
router.get('/my-playlists', protect, async (req, res) => {
  try {
    const playlists = await Playlist.find({ creator: req.user._id })
      .populate('creator', 'name')
      .populate({ path: 'tracks', select: 'coverUrl' })
      .sort({ createdAt: -1 });
    res.json(playlists);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving your playlists' });
  }
});

// @desc    Get single playlist by ID
// @route   GET /api/playlists/:id
// @access  Public/Private (depending on public status)
router.get('/:id', async (req, res) => {
  try {
    if (req.params.id && req.params.id.startsWith('jamendo-playlist-')) {
      const numericId = req.params.id.replace('jamendo-playlist-', '');

      try {
        const mappedPlaylist = await getSpotifyPlaylist(numericId);
        return res.json(mappedPlaylist);
      } catch (err) {
        console.error('Error fetching Spotify playlist details:', err);
        return res.status(500).json({ message: 'Error retrieving Spotify playlist' });
      }
    }

    if (req.params.id && req.params.id.startsWith('jamendo-album-')) {
      const numericId = req.params.id.replace('jamendo-album-', '');

      try {
        let mappedPlaylist = null;
        try {
          mappedPlaylist = await getSpotifyAlbum(numericId);
        } catch (fetchErr) {
          console.error('Fetch to Spotify API failed:', fetchErr);
        }

        if (!mappedPlaylist) {
          // Dynamic fallback compilation
          console.log(`Generating premium fallback playlist for Spotify Album ID: ${numericId}`);
          
          let fallbackTracks = [];
          const { getSpotifyTrending } = require('../utils/spotifyService');
          try {
            fallbackTracks = await getSpotifyTrending(10);
          } catch (e) {
            console.error('Failed to get popular tracks fallback:', e);
          }

          if (fallbackTracks.length === 0) {
            const localTracks = await Track.find().limit(10);
            fallbackTracks = localTracks.map(t => ({
              ...t.toObject(),
              isJamendo: false
            }));
          }

          mappedPlaylist = {
            _id: `jamendo-album-${numericId}`,
            name: `Independent Album Collection #${numericId}`,
            description: `A fine selection of licensed music, curated dynamically by Musico Editors.`,
            coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=300&auto=format&fit=crop',
            creator: {
              _id: 'spotify-editor',
              name: 'Spotify Curators'
            },
            tracks: fallbackTracks
          };
        }

        return res.json(mappedPlaylist);
      } catch (err) {
        console.error('Error fetching Spotify album details:', err);
        return res.status(500).json({ message: 'Error retrieving Spotify album' });
      }
    }

    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.json({
        _id: req.params.id,
        name: 'Public Featured Playlist',
        description: 'A fine selection of licensed music, curated dynamically by Musico Editors.',
        coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=300&auto=format&fit=crop',
        creator: { _id: 'musico-editor', name: 'Musico Curators' },
        tracks: []
      });
    }

    const playlist = await Playlist.findById(req.params.id)
      .populate('creator', 'name')
      .populate({
        path: 'tracks',
        model: 'Track',
      });

    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }

    res.json(playlist);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving playlist details' });
  }
});

// @desc    Update playlist
// @route   PUT /api/playlists/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    let playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }

    // Ensure user is the creator
    if (playlist.creator.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to edit this playlist' });
    }

    const { name, description, isPublic, coverUrl } = req.body;
    playlist.name = name || playlist.name;
    playlist.description = description !== undefined ? description : playlist.description;
    playlist.isPublic = isPublic !== undefined ? isPublic : playlist.isPublic;
    playlist.coverUrl = coverUrl !== undefined ? coverUrl : playlist.coverUrl;

    await playlist.save();
    res.json(playlist);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating playlist' });
  }
});

// @desc    Delete playlist
// @route   DELETE /api/playlists/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }

    // Ensure user is the creator
    if (playlist.creator.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to delete this playlist' });
    }

    await playlist.deleteOne();
    res.json({ message: 'Playlist removed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error removing playlist' });
  }
});

// @desc    Add track to playlist
// @route   POST /api/playlists/:id/tracks
// @access  Private
router.post('/:id/tracks', protect, async (req, res) => {
  const { trackId } = req.body;

  if (!trackId) {
    return res.status(400).json({ message: 'Track ID is required' });
  }

  try {
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }

    // Ensure user is creator
    if (playlist.creator.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to edit this playlist' });
    }

    let track;
    if (trackId.startsWith('jamendo-')) {
      const numericId = trackId.replace('jamendo-', '');

      // Check if already mirrored
      track = await Track.findOne({ $or: [{ jamendoTrackId: numericId }, { audioUrl: { $regex: numericId } }] });
      if (!track) {
        // Fetch track metadata from Spotify
        try {
          const t = await getSpotifyTrack(numericId);
          const systemArtistId = '60d5ecb8b5de9f0015b3c5a0';
          track = await Track.create({
            title: t.title,
            artist: systemArtistId,
            artistName: t.artistName,
            audioUrl: t.audioUrl,
            coverUrl: t.coverUrl,
            duration: t.duration,
            genre: t.genre,
            plays: t.plays,
            isJamendo: true,
            jamendoArtistId: t.jamendoArtistId,
            jamendoTrackId: t.jamendoTrackId,
            contributors: t.contributors
          });
        } catch (err) {
          console.error('Failed to retrieve track metadata from Spotify:', err.message);
        }
      }
    } else {
      track = await Track.findById(trackId);
    }

    if (!track) {
      return res.status(404).json({ message: 'Track not found' });
    }

    // Avoid duplicates
    if (playlist.tracks.includes(track._id)) {
      return res.status(400).json({ message: 'Track already exists in this playlist' });
    }

    playlist.tracks.push(track._id);

    // Update cover image dynamically on frontend instead of hardcoding in DB
    // if (playlist.coverUrl.includes('unsplash.com') && track.coverUrl) {
    //   playlist.coverUrl = track.coverUrl;
    // }

    await playlist.save();
    res.status(200).json(playlist);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error adding track' });
  }
});

// @desc    Remove track from playlist
// @route   DELETE /api/playlists/:id/tracks/:trackId
// @access  Private
router.delete('/:id/tracks/:trackId', protect, async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }

    // Ensure user is creator
    if (playlist.creator.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to edit this playlist' });
    }

    const index = playlist.tracks.indexOf(req.params.trackId);
    if (index === -1) {
      return res.status(404).json({ message: 'Track not found in this playlist' });
    }

    playlist.tracks.splice(index, 1);
    await playlist.save();

    res.json({ message: 'Track removed from playlist successfully', playlist });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error removing track' });
  }
});

module.exports = router;
