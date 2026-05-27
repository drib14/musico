const express = require('express');
const router = express.Router();
const Playlist = require('../models/Playlist');
const Track = require('../models/Track');
const { protect } = require('../middleware/authMiddleware');

// @desc    Create new playlist
// @route   POST /api/playlists
// @access  Private
router.post('/', protect, async (req, res) => {
  const { name, description, isPublic } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Playlist name is required' });
  }

  try {
    const playlist = await Playlist.create({
      name,
      description: description || '',
      creator: req.user._id,
      isPublic: isPublic !== undefined ? isPublic : true,
      coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=300&auto=format&fit=crop', // default cover
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
  const clientId = process.env.JAMENDO_CLIENT_ID || '444d4f6c';
  try {
    // 1. Fetch local public playlists
    const localPlaylists = await Playlist.find({ isPublic: true })
      .populate('creator', 'name')
      .sort({ createdAt: -1 });

    // 2. Fetch popular Jamendo albums to represent premium licensed collections
    let jamendoAlbums = [];
    try {
      const jamAlbumUrl = `https://api.jamendo.com/v3.0/albums/?client_id=${clientId}&format=json&limit=10&order=popularity_total`;
      const jamAlbumRes = await fetch(jamAlbumUrl);
      if (jamAlbumRes.ok) {
        const data = await jamAlbumRes.json();
        jamendoAlbums = (data.results || []).map((al) => ({
          _id: `jamendo-album-${al.id}`,
          name: al.name,
          description: `Licensed Album by ${al.artist_name}. Stream complete tracks on Musico.`,
          coverUrl: al.image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=300&auto=format&fit=crop',
          creator: {
            _id: al.artist_id,
            name: al.artist_name
          },
          tracks: new Array(10), // mock track length mapping
          isJamendoAlbum: true,
          artistName: al.artist_name,
          artistId: al.artist_id
        }));
      }
    } catch (err) {
      console.error('Error fetching Jamendo albums for homepage:', err);
    }

    const mergedPlaylists = [...localPlaylists, ...jamendoAlbums];
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
    if (req.params.id && req.params.id.startsWith('jamendo-album-')) {
      const clientId = process.env.JAMENDO_CLIENT_ID || '444d4f6c';
      const numericId = req.params.id.replace('jamendo-album-', '');

      try {
        const jamRes = await fetch(
          `https://api.jamendo.com/v3.0/albums/tracks/?client_id=${clientId}&format=json&id=${numericId}`
        );
        if (!jamRes.ok) throw new Error('Failed to retrieve album from Jamendo');

        const data = await jamRes.json();
        if (!data.results || data.results.length === 0) {
          return res.status(404).json({ message: 'Album not found on Jamendo' });
        }

        const album = data.results[0];
        const mappedPlaylist = {
          _id: `jamendo-album-${album.id}`,
          name: album.name,
          description: `Album by ${album.artist_name}. Released on Jamendo.`,
          coverUrl: album.image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=300&auto=format&fit=crop',
          creator: {
            _id: album.artist_id,
            name: album.artist_name
          },
          tracks: (album.tracks || []).map(t => ({
            _id: `jamendo-${t.id}`,
            title: t.name,
            artist: album.artist_id,
            artistName: album.artist_name,
            audioUrl: t.audio,
            coverUrl: album.image || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300&auto=format&fit=crop',
            duration: t.duration || 180,
            genre: 'Licensed Music',
            plays: 24500,
            isJamendo: true,
            jamendoArtistId: album.artist_id,
            jamendoTrackId: t.id
          }))
        };

        return res.json(mappedPlaylist);
      } catch (err) {
        console.error('Error fetching Jamendo album details:', err);
        return res.status(500).json({ message: 'Error retrieving Jamendo album' });
      }
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

    const { name, description, isPublic } = req.body;
    playlist.name = name || playlist.name;
    playlist.description = description !== undefined ? description : playlist.description;
    playlist.isPublic = isPublic !== undefined ? isPublic : playlist.isPublic;

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
      const clientId = process.env.JAMENDO_CLIENT_ID || '444d4f6c';
      const numericId = trackId.replace('jamendo-', '');

      // Check if already mirrored
      track = await Track.findOne({ audioUrl: { $regex: numericId } });
      if (!track) {
        // Fetch track metadata from Jamendo
        const jamRes = await fetch(
          `https://api.jamendo.com/v3.0/tracks/?client_id=${clientId}&format=json&id=${numericId}`
        );
        if (jamRes.ok) {
          const data = await jamRes.json();
          if (data.results && data.results.length > 0) {
            const t = data.results[0];
            const systemArtistId = '60d5ecb8b5de9f0015b3c5a0';
            track = await Track.create({
              title: t.name,
              artist: systemArtistId,
              artistName: t.artist_name,
              audioUrl: t.audio,
              coverUrl: t.image || t.album_image || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300&auto=format&fit=crop',
              duration: t.duration || 180,
              genre: t.musicinfo?.tags?.genres?.[0] || 'Licensed Music',
              plays: t.stats?.playcount_total || 24500,
              isJamendo: true,
              jamendoArtistId: t.artist_id,
              jamendoTrackId: t.id
            });
          }
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

    // Update cover image to match the first added track cover if playlist is using default
    if (playlist.coverUrl.includes('unsplash.com') && track.coverUrl) {
      playlist.coverUrl = track.coverUrl;
    }

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
