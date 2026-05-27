const express = require('express');
const router = express.Router();
const multer = require('multer');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
const Track = require('../models/Track');
const User = require('../models/User');
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

    const tracks = await Track.find(query).sort({ createdAt: -1 });
    res.json(tracks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving tracks' });
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
    const track = await Track.findById(req.params.id);
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

module.exports = router;
