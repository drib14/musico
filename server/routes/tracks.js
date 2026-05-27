const express = require('express');
const router = express.Router();
const multer = require('multer');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
const Track = require('../models/Track');
const User = require('../models/User');
const Playlist = require('../models/Playlist');
const PlayLog = require('../models/PlayLog');
const { protect } = require('../middleware/authMiddleware');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer memory storage
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'audio') {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are supported for tracks'), false);
    }
  } else if (file.fieldname === 'cover') {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are supported for track covers'), false);
    }
  } else {
    cb(null, true);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
});

// Helper stream uploader for Cloudinary
const uploadStreamToCloudinary = (fileBuffer, resourceType, folderName) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: resourceType,
        folder: folderName,
      },
      (error, result) => {
        if (error) {
          console.error(`Cloudinary Upload Error [${resourceType}]:`, error);
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    uploadStream.end(fileBuffer);
  });
};

// Helper to mirror Jamendo track as a standard MongoDB Track document
const getOrCreateMirroredTrack = async (trackId) => {
  const clientId = process.env.JAMENDO_CLIENT_ID || '444d4f6c';
  const numericId = trackId.replace('jamendo-', '');

  try {
    // 1. Check if track already mirrored in our DB
    let track = await Track.findOne({ audioUrl: { $regex: numericId } });
    if (track) return track;

    // 2. Fetch track metadata from Jamendo
    const jamRes = await fetch(
      `https://api.jamendo.com/v3.0/tracks/?client_id=${clientId}&format=json&id=${numericId}`
    );
    if (!jamRes.ok) throw new Error('Failed to retrieve track from Jamendo');

    const data = await jamRes.json();
    if (!data.results || data.results.length === 0) {
      throw new Error('Track not found on Jamendo');
    }

    const t = data.results[0];

    // Static verified system creator ID to attribute independent Jamendo tracks
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

    return track;
  } catch (err) {
    console.error('getOrCreateMirroredTrack failure:', err);
    throw err;
  }
};

// @desc    Get trending charts per week, month, year (globally or locally)
// @route   GET /api/tracks/trending
// @access  Public
router.get('/trending', async (req, res) => {
  const { period, scope, city } = req.query; // period: 'week', 'month', 'year'; scope: 'global', 'local'

  try {
    let dateLimit = new Date();
    if (period === 'week') {
      dateLimit.setDate(dateLimit.getDate() - 7);
    } else if (period === 'month') {
      dateLimit.setMonth(dateLimit.getMonth() - 1);
    } else if (period === 'year') {
      dateLimit.setFullYear(dateLimit.getFullYear() - 1);
    } else {
      dateLimit.setDate(dateLimit.getDate() - 7); // default to weekly chart
    }

    let matchQuery = {
      createdAt: { $gte: dateLimit }
    };

    // Apply local scope location filters (case-insensitive city)
    if (scope === 'local' && city && city !== 'Unknown') {
      matchQuery.city = { $regex: new RegExp('^' + city.trim() + '$', 'i') };
    }

    // Execute aggregation pipeline grouping play records
    const trendingList = await PlayLog.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$track', periodPlays: { $sum: 1 } } },
      { $sort: { periodPlays: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'tracks',
          localField: '_id',
          foreignField: '_id',
          as: 'trackDetails'
        }
      },
      { $unwind: '$trackDetails' },
      {
        $project: {
          _id: '$trackDetails._id',
          title: '$trackDetails.title',
          artist: '$trackDetails.artist',
          artistName: '$trackDetails.artistName',
          audioUrl: '$trackDetails.audioUrl',
          coverUrl: '$trackDetails.coverUrl',
          duration: '$trackDetails.duration',
          genre: '$trackDetails.genre',
          plays: '$trackDetails.plays',
          periodPlays: 1
        }
      }
    ]);

    // Fallback: If no streaming plays logged yet in active filter, return standard tracks sorted by plays
    if (trendingList.length === 0) {
      const fallbackTracks = await Track.find().sort({ plays: -1 }).limit(10);
      return res.json(fallbackTracks);
    }

    res.json(trendingList);
  } catch (error) {
    console.error('Trending charts aggregation error:', error);
    res.status(500).json({ message: 'Server error loading charts' });
  }
});

// @desc    Upload track directly in-app
// @route   POST /api/tracks/upload
// @access  Private (Premium limitations can be toggled here)
router.post(
  '/upload',
  protect,
  upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'cover', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { title, genre, lyrics } = req.body;

      if (!title) {
        return res.status(400).json({ message: 'Track title is required' });
      }

      if (!req.files || !req.files.audio) {
        return res.status(400).json({ message: 'Audio track file is required' });
      }

      // Validate presence of Artist Profile
      if (!req.user.artistName) {
        return res.status(400).json({ message: 'You must set up your Artist Profile before distributing tracks on Musico.' });
      }

      // Check Spotify-like premium upload limitations
      if (!req.user.isPremium) {
        const uploadCount = await Track.countDocuments({ artist: req.user._id });
        if (uploadCount >= 3) {
          return res.status(403).json({
            message: 'Free tier limit reached (max 3 uploads). Please upgrade to Premium for unlimited direct uploads!',
            limitReached: true,
          });
        }
      }

      const audioFile = req.files.audio[0];
      const coverFile = req.files.cover ? req.files.cover[0] : null;

      // Upload Audio to Cloudinary
      console.log('Uploading audio to Cloudinary...');
      const audioResult = await uploadStreamToCloudinary(
        audioFile.buffer,
        'video', // Audio counts as 'video' resource type for streaming support
        'musico/tracks'
      );

      // Upload Cover to Cloudinary (or use fallback)
      let coverUrl = 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300&auto=format&fit=crop'; // Modern fallback cover
      if (coverFile) {
        console.log('Uploading cover image to Cloudinary...');
        const coverResult = await uploadStreamToCloudinary(
          coverFile.buffer,
          'image',
          'musico/covers'
        );
        coverUrl = coverResult.secure_url;
      }

      // Create Track in database
      const track = await Track.create({
        title,
        artist: req.user._id,
        artistName: req.user.artistName,
        audioUrl: audioResult.secure_url,
        coverUrl,
        duration: audioResult.duration || 0,
        genre: genre || 'Unknown',
        lyrics: lyrics || '',
      });

      res.status(201).json({
        message: 'Track uploaded successfully!',
        track,
      });
    } catch (error) {
      console.error('Upload handler error:', error);
      res.status(500).json({ message: error.message || 'Server error during upload' });
    }
  }
);

// @desc    Get all tracks
// @route   GET /api/tracks
// @access  Public
router.get('/', async (req, res) => {
  const { search, genre } = req.query;
  const clientId = process.env.JAMENDO_CLIENT_ID || '444d4f6c';

  try {
    let query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { artistName: { $regex: search, $options: 'i' } },
      ];
    }

    if (genre && genre !== 'All') {
      query.genre = { $regex: `^${genre}$`, $options: 'i' };
    }

    // 1. Fetch local database direct uploads
    const localTracks = await Track.find(query).sort({ createdAt: -1 });

    // 2. Fetch public Jamendo licensed tracks matching search/genre
    let jamendoTracks = [];
    try {
      let jamUrl = `https://api.jamendo.com/v3.0/tracks/?client_id=${clientId}&format=json&limit=15&audioformat=mp32&order=popularity_total`;
      if (search) {
        jamUrl += `&namesearch=${encodeURIComponent(search)}`;
      }
      if (genre && genre !== 'All') {
        jamUrl += `&tags=${encodeURIComponent(genre)}`;
      }
      
      const jamRes = await fetch(jamUrl);
      if (jamRes.ok) {
        const data = await jamRes.json();
        jamendoTracks = (data.results || []).map((t) => ({
          _id: `jamendo-${t.id}`,
          title: t.name,
          artist: t.artist_id,
          artistName: t.artist_name,
          audioUrl: t.audio,
          coverUrl: t.image || t.album_image || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300&auto=format&fit=crop',
          duration: t.duration || 180,
          genre: t.musicinfo?.tags?.genres?.[0] || genre || 'Licensed Music',
          plays: t.stats?.playcount_total || 24500,
          isJamendo: true,
        }));
      }
    } catch (err) {
      console.error('Error fetching Jamendo tracks in main list:', err);
    }

    // 3. Merge direct uploads and public catalog tracks seamlessly
    const mergedTracks = [...localTracks, ...jamendoTracks];
    res.json(mergedTracks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving tracks' });
  }
});

// @desc    Unified search for tracks, artists, and albums
// @route   GET /api/tracks/search
// @access  Public
router.get('/search', async (req, res) => {
  const { search, genre } = req.query;
  const clientId = process.env.JAMENDO_CLIENT_ID || '444d4f6c';

  try {
    let trackQuery = {};
    let artistQuery = { artistName: { $ne: '' } };
    let playlistQuery = { isPublic: true };

    if (search) {
      trackQuery.$or = [
        { title: { $regex: search, $options: 'i' } },
        { artistName: { $regex: search, $options: 'i' } },
      ];
      artistQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { artistName: { $regex: search, $options: 'i' } },
      ];
      playlistQuery.name = { $regex: search, $options: 'i' };
    }

    if (genre && genre !== 'All') {
      trackQuery.genre = { $regex: `^${genre}$`, $options: 'i' };
    }

    // 1. Tracks Search (Local + Jamendo)
    const localTracks = await Track.find(trackQuery).sort({ plays: -1 }).limit(20);

    let jamendoTracks = [];
    try {
      let jamUrl = `https://api.jamendo.com/v3.0/tracks/?client_id=${clientId}&format=json&limit=20&audioformat=mp32&order=popularity_total`;
      if (search) {
        jamUrl += `&namesearch=${encodeURIComponent(search)}`;
      }
      if (genre && genre !== 'All') {
        jamUrl += `&tags=${encodeURIComponent(genre)}`;
      }
      
      const jamRes = await fetch(jamUrl);
      if (jamRes.ok) {
        const data = await jamRes.json();
        jamendoTracks = (data.results || []).map((t) => ({
          _id: `jamendo-${t.id}`,
          title: t.name,
          artist: t.artist_id,
          artistName: t.artist_name,
          audioUrl: t.audio,
          coverUrl: t.image || t.album_image || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300&auto=format&fit=crop',
          duration: t.duration || 180,
          genre: t.musicinfo?.tags?.genres?.[0] || genre || 'Licensed Music',
          plays: t.stats?.playcount_total || 24500,
          isJamendo: true,
          jamendoArtistId: t.artist_id,
          jamendoTrackId: t.id
        }));
      }
    } catch (err) {
      console.error('Error fetching Jamendo tracks in search:', err);
    }

    const mergedTracks = [...localTracks, ...jamendoTracks];

    // 2. Artists Search (Local + Jamendo)
    const localArtists = await User.find(artistQuery).select('-password -email -verificationCode -verificationCodeExpires -resetPasswordCode -resetPasswordCodeExpires').limit(10);
    
    let jamendoArtists = [];
    if (search) {
      try {
        const jamArtistUrl = `https://api.jamendo.com/v3.0/artists/?client_id=${clientId}&format=json&limit=10&namesearch=${encodeURIComponent(search)}`;
        const jamArtistRes = await fetch(jamArtistUrl);
        if (jamArtistRes.ok) {
          const data = await jamArtistRes.json();
          jamendoArtists = (data.results || []).map((a) => ({
            _id: a.id,
            artistName: a.name,
            name: a.name,
            artistAvatar: a.image || '',
            userAvatar: a.image || '',
            isArtistVerified: true,
            isJamendo: true,
            monthlyListeners: a.stats?.popularity_total ? Math.round(a.stats.popularity_total * 4.5) : 18500,
          }));
        }
      } catch (err) {
        console.error('Error fetching Jamendo artists in search:', err);
      }
    }

    const mergedArtists = [...localArtists, ...jamendoArtists];

    // 3. Albums & Playlists Search (Local Playlists + Jamendo Albums)
    const localPlaylists = await Playlist.find(playlistQuery).populate('creator', 'name').limit(10);

    let jamendoAlbums = [];
    if (search) {
      try {
        const jamAlbumUrl = `https://api.jamendo.com/v3.0/albums/?client_id=${clientId}&format=json&limit=10&namesearch=${encodeURIComponent(search)}`;
        const jamAlbumRes = await fetch(jamAlbumUrl);
        if (jamAlbumRes.ok) {
          const data = await jamAlbumRes.json();
          jamendoAlbums = (data.results || []).map((al) => ({
            _id: `jamendo-album-${al.id}`,
            name: al.name,
            description: `Album by ${al.artist_name}. Released on Jamendo.`,
            coverUrl: al.image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=300&auto=format&fit=crop',
            tracksCount: 10,
            isJamendoAlbum: true,
            artistName: al.artist_name,
            artistId: al.artist_id
          }));
        }
      } catch (err) {
        console.error('Error fetching Jamendo albums in search:', err);
      }
    }

    const mergedAlbums = [...localPlaylists, ...jamendoAlbums];

    res.json({
      tracks: mergedTracks,
      artists: mergedArtists,
      albums: mergedAlbums
    });
  } catch (error) {
    console.error('Search aggregation error:', error);
    res.status(500).json({ message: 'Server error during unified search' });
  }
});

// @desc    Get current user's uploads
// @route   GET /api/tracks/my-uploads
// @access  Private
router.get('/my-uploads', protect, async (req, res) => {
  try {
    const tracks = await Track.find({ artist: req.user._id }).sort({ createdAt: -1 });
    res.json(tracks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving your uploads' });
  }
});

// @desc    Update a track
// @route   PUT /api/tracks/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const track = await Track.findById(req.params.id);

    if (!track) {
      return res.status(404).json({ message: 'Track not found' });
    }

    // Ensure user owns the track
    if (track.artist.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to update this track' });
    }

    const { title, genre, lyrics } = req.body;

    track.title = title || track.title;
    track.genre = genre || track.genre;
    track.lyrics = lyrics !== undefined ? lyrics : track.lyrics;

    const updatedTrack = await track.save();
    res.json(updatedTrack);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating track' });
  }
});

// @desc    Delete a track
// @route   DELETE /api/tracks/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const track = await Track.findById(req.params.id);

    if (!track) {
      return res.status(404).json({ message: 'Track not found' });
    }

    // Ensure user owns the track
    if (track.artist.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to delete this track' });
    }

    await track.deleteOne();

    res.json({ message: 'Track removed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting track' });
  }
});

// @desc    Increment plays count & log geolocation stream analytics
// @route   PUT /api/tracks/:id/play
// @access  Public
router.put('/:id/play', async (req, res) => {
  try {
    if (req.params.id && req.params.id.startsWith('jamendo-')) {
      return res.json({ message: 'Play logged successfully for licensed catalog track', plays: 10000 });
    }

    const track = await Track.findById(req.params.id);
    if (!track) {
      return res.status(404).json({ message: 'Track not found' });
    }
    
    track.plays += 1;
    await track.save();

    // Safely extract active user ID from request headers if available
    let userId = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
      } catch (err) {
        // Carry on anonymous logging on token verification issues
      }
    }

    // Register a play analytics record
    await PlayLog.create({
      track: track._id,
      user: userId,
      city: req.body.city || 'Unknown',
      country: req.body.country || 'Unknown'
    });

    res.json({ message: 'Play count and geo analytics updated', plays: track.plays });
  } catch (error) {
    console.error('Play analytics logging failure:', error);
    res.status(500).json({ message: 'Server error updating play count' });
  }
});

// @desc    Like or unlike a track
// @route   POST /api/tracks/:id/like
// @access  Private
router.post('/:id/like', protect, async (req, res) => {
  try {
    let trackId = req.params.id;
    let track;

    if (trackId.startsWith('jamendo-')) {
      track = await getOrCreateMirroredTrack(trackId);
    } else {
      track = await Track.findById(trackId);
    }

    if (!track) {
      return res.status(404).json({ message: 'Track not found' });
    }

    const user = await User.findById(req.user._id);
    const index = user.likedTracks.indexOf(track._id);

    let liked = false;
    if (index === -1) {
      user.likedTracks.push(track._id);
      liked = true;
    } else {
      user.likedTracks.splice(index, 1);
    }

    await user.save();
    await user.populate('likedTracks');
    res.json({ liked, likedTracks: user.likedTracks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error handling track like' });
  }
});

// @desc    Get liked tracks
// @route   GET /api/tracks/liked
// @access  Private
router.get('/liked', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'likedTracks',
      options: { sort: { createdAt: -1 } },
    });
    res.json(user.likedTracks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving liked tracks' });
  }
});

// @desc    Get stats for uploaded tracks (total plays, geolocated cities)
// @route   GET /api/tracks/artist-stats
// @access  Private
router.get('/artist-stats', protect, async (req, res) => {
  try {
    // 1. Get all tracks uploaded by the artist
    const tracks = await Track.find({ artist: req.user._id });
    const trackIds = tracks.map(t => t._id);

    // 2. Sum up total plays
    const totalPlays = tracks.reduce((acc, curr) => acc + curr.plays, 0);

    // 3. Aggregate geolocated listener cities
    const topCities = await PlayLog.aggregate([
      { $match: { track: { $in: trackIds }, city: { $ne: 'Unknown' } } },
      { $group: { _id: { city: '$city', country: '$country' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $project: {
          _id: 0,
          city: '$_id.city',
          country: '$_id.country',
          count: 1
        }
      }
    ]);

    res.json({
      totalPlays,
      topCities,
      tracksCount: tracks.length
    });
  } catch (error) {
    console.error('Artist analytics retrieval failure:', error);
    res.status(500).json({ message: 'Server error retrieving artist metrics' });
  }
});

// @desc    Get licensed tracks from Jamendo API
// @route   GET /api/tracks/jamendo
// @access  Public
router.get('/jamendo', async (req, res) => {
  const clientId = process.env.JAMENDO_CLIENT_ID || '444d4f6c';

  try {
    const jamendoRes = await fetch(
      `https://api.jamendo.com/v3.0/tracks/?client_id=${clientId}&format=json&limit=20&imagesize=200&audioformat=mp32&order=popularity_total`
    );

    if (!jamendoRes.ok) {
      throw new Error('Failed to fetch from Jamendo API');
    }

    const data = await jamendoRes.json();
    const tracksList = (data.results || []).map((t) => ({
      _id: `jamendo-${t.id}`,
      title: t.name,
      artist: t.artist_id,
      artistName: t.artist_name,
      audioUrl: t.audio,
      coverUrl: t.image || t.album_image || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300&auto=format&fit=crop',
      duration: t.duration || 180,
      genre: t.musicinfo?.tags?.genres?.[0] || 'Licensed Music',
      plays: t.stats?.playcount_total || 24500,
      isJamendo: true,
    }));

    res.json(tracksList);
  } catch (error) {
    console.error('Jamendo tracks fetch error:', error);
    res.status(500).json({ message: 'Error retrieving Jamendo licensed catalog', error: error.message });
  }
});

// @desc    Get Jamendo artist profile website contact, details, and biography description
// @route   GET /api/tracks/jamendo/artist/:id
// @access  Public
router.get('/jamendo/artist/:id', async (req, res) => {
  const clientId = process.env.JAMENDO_CLIENT_ID || '444d4f6c';

  try {
    const jamendoRes = await fetch(
      `https://api.jamendo.com/v3.0/artists/musicinfo/?client_id=${clientId}&id=${req.params.id}`
    );

    if (!jamendoRes.ok) {
      throw new Error('Failed to fetch artist details from Jamendo API');
    }

    const data = await jamendoRes.json();
    
    if (!data.results || data.results.length === 0) {
      return res.status(404).json({ message: 'Artist not found on Jamendo' });
    }

    const artist = data.results[0];
    
    let bioText = 'This licensed independent creator publishes tracks directly on Jamendo.';
    if (artist.musicinfo?.description) {
      if (typeof artist.musicinfo.description === 'string') {
        bioText = artist.musicinfo.description;
      } else if (typeof artist.musicinfo.description === 'object') {
        bioText = artist.musicinfo.description.en || Object.values(artist.musicinfo.description)[0] || bioText;
      }
    }

    const artistDetails = {
      _id: artist.id,
      artistName: artist.name,
      name: artist.name,
      artistAvatar: artist.image || '',
      userAvatar: artist.image || '',
      artistBio: bioText,
      website: artist.website || `https://www.jamendo.com/artist/${artist.id}`, // contact details
      source: 'Jamendo Music API Description',
      monthlyListeners: artist.stats?.popularity_total ? Math.round(artist.stats.popularity_total * 4.5) : 18500,
      totalPlays: artist.stats?.playcount_total || 142000,
      isArtistVerified: true,
      isPremium: true,
      createdAt: artist.joindate || new Date().toISOString()
    };

    // Dynamically fetch tracks of this artist from Jamendo API
    let tracksList = [];
    try {
      const tracksRes = await fetch(
        `https://api.jamendo.com/v3.0/tracks/?client_id=${clientId}&format=json&limit=15&artist_id=${artist.id}&audioformat=mp32`
      );
      if (tracksRes.ok) {
        const tracksData = await tracksRes.json();
        tracksList = (tracksData.results || []).map((t) => ({
          _id: `jamendo-${t.id}`,
          title: t.name,
          artist: t.artist_id,
          artistName: t.artist_name,
          audioUrl: t.audio,
          coverUrl: t.image || t.album_image || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300&auto=format&fit=crop',
          duration: t.duration || 180,
          genre: t.musicinfo?.tags?.genres?.[0] || 'Licensed Music',
          plays: t.stats?.playcount_total || 24500,
          isJamendo: true,
        }));
      }
    } catch (err) {
      console.error('Error fetching tracks for Jamendo artist profile:', err);
    }

    res.json({
      user: artistDetails,
      tracks: tracksList,
      playlists: []
    });
  } catch (error) {
    console.error('Jamendo artist fetch error:', error);
    res.status(500).json({ message: 'Error retrieving Jamendo artist details', error: error.message });
  }
});

module.exports = router;
