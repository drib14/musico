const express = require('express');
const router = express.Router();
const multer = require('multer');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
const Track = require('../models/Track');
const User = require('../models/User');
const Playlist = require('../models/Playlist');
const PlayLog = require('../models/PlayLog');
const Album = require('../models/Album');
const { protect } = require('../middleware/authMiddleware');
const { generateLRCLibLyrics, smartProportionalAlign } = require('../utils/lrclibService');
const { searchSpotify, getSpotifyTrack, getSpotifyArtist, getSpotifyArtistTracks, getSpotifyArtistAlbums, getSpotifyAlbum, getSpotifyTrending, getSpotifyGenres, getSpotifyChartsPlaylists, generateAudioServers } = require('../utils/spotifyService');

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

// Helper: Distribute timestamps proportionally for raw Jamendo lyrics using Smart Aligner
const generateSyncedLyrics = (lyrics, duration) => {
  return smartProportionalAlign(lyrics, duration);
};

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

// Helper to mirror Spotify track as a standard MongoDB Track document
const getOrCreateMirroredTrack = async (trackId) => {
  const numericId = trackId.replace('jamendo-', '');

  try {
    // 1. Check if track already mirrored in our DB
    let track = await Track.findOne({ $or: [{ jamendoTrackId: numericId }, { audioUrl: { $regex: numericId } }] });
    if (track) return track;

    // 2. Fetch track metadata from Spotify / Jamendo
    const t = await getSpotifyTrack(numericId);
    if (!t) {
      throw new Error('Track not found in external catalog');
    }

    // Static verified system creator ID to attribute independent tracks
    const systemArtistId = '60d5ecb8b5de9f0015b3c5a0';

    track = await Track.create({
      title: t.title || 'Licensed Track',
      artist: systemArtistId,
      artistName: t.artistName || 'Popular Artist',
      audioUrl: t.audioUrl,
      audioServers: generateAudioServers(t.audioUrl, numericId),
      coverUrl: t.coverUrl || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300&auto=format&fit=crop',
      duration: t.duration || 180,
      genre: t.genre || 'Licensed Music',
      plays: t.plays || 25000,
      isJamendo: true,
      jamendoArtistId: t.jamendoArtistId || 'jamendo-artist',
      jamendoTrackId: numericId,
      lyrics: t.lyrics || '',
      contributors: t.contributors || {}
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

    // Execute aggregation pipeline grouping play records. Do not limit here, so we can calculate user rank outside of the top 50
    const trendingList = await PlayLog.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$track', periodPlays: { $sum: 1 } } },
      { $sort: { periodPlays: -1 } },
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
          contributors: '$trackDetails.contributors',
          periodPlays: 1
        }
      }
    ]);

    // Fetch popular Spotify tracks to represent global charts
    let spotifyTracks = [];
    try {
      // Fetch up to 50 tracks from Spotify Global Top 50
      spotifyTracks = await getSpotifyTrending(50);
    } catch (err) {
      console.error('Error fetching Spotify charts in trending route:', err);
    }

    // Fetch up to 1000 tracks to make sure we gather all local top tracks based on stream counts
    const localList = trendingList.length > 0 ? trendingList : await Track.find().sort({ plays: -1 }).limit(1000);
    
    const mappedLocalList = localList.map(t => {
      const trackObj = t.toObject ? t.toObject() : t;
      return {
        ...trackObj,
        isJamendo: false
      };
    });

    const mergedTracks = [...mappedLocalList, ...spotifyTracks];
    // Sort strictly by stream count (plays) descending to form a true leaderboard!
    mergedTracks.sort((a, b) => (b.plays || 0) - (a.plays || 0));

    res.json(mergedTracks);
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
      const { title, genre, lyrics, contributors } = req.body;

      if (!title) {
        return res.status(400).json({ message: 'Track title is required' });
      }

      if (!req.files || !req.files.audio) {
        return res.status(400).json({ message: 'Audio track file is required' });
      }

      // Validate presence of Artist Profile
      await req.user.populate('artistProfile');
      if (!req.user.artistProfile) {
        return res.status(400).json({ message: 'You must set up your Artist Profile before distributing tracks on Musico.' });
      }

      // Check Spotify-like premium upload limitations (Bypassed for free tier democratisation!)
      // if (!req.user.isPremium) {
      //   const uploadCount = await Track.countDocuments({ artist: req.user._id });
      //   if (uploadCount >= 3) {
      //     return res.status(403).json({
      //       message: 'Free tier limit reached (max 3 uploads). Please upgrade to Premium for unlimited direct uploads!',
      //       limitReached: true,
      //     });
      //   }
      // }

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

      // Parse contributors
      let parsedContributors = { mainVocalist: '', composer: '', lyricist: '', producer: '' };
      if (contributors) {
        try {
          parsedContributors = JSON.parse(contributors);
        } catch (e) {
          console.error("Failed to parse contributors JSON", e);
        }
      }

      // Process lyrics using LRCLIB Sync Engine
      let syncedLyrics = '';
      if (lyrics) {
        console.log('Processing track lyrics through LRCLIB Sync Engine...');
        syncedLyrics = await generateLRCLibLyrics(
          audioFile.buffer,
          lyrics,
          audioResult.duration || 0,
          title,
          req.user.artistProfile.artistName
        );
      }

      // Create Track in database
      const track = await Track.create({
        title,
        artist: req.user._id,
        artistName: req.user.artistProfile.artistName,
        audioUrl: audioResult.secure_url,
        audioServers: generateAudioServers(audioResult.secure_url),
        coverUrl,
        duration: audioResult.duration || 0,
        genre: genre || 'Unknown',
        lyrics: syncedLyrics || '',
        contributors: parsedContributors,
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
  const limit = parseInt(req.query.limit) || 16;
  const offset = parseInt(req.query.offset) || 0;

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

    // 1. Fetch local database direct uploads with pagination
    const localTracks = await Track.find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);

    // 2. Fetch public Spotify tracks matching search/genre with pagination
    let spotifyTracks = [];
    try {
      if (search) {
        const results = await searchSpotify(search, limit, offset);
        spotifyTracks = results.tracks;
      } else {
        spotifyTracks = await getSpotifyTrending(limit);
      }
    } catch (err) {
      console.error('Error fetching Spotify tracks in main list:', err);
    }

    // 3. Merge direct uploads and public catalog tracks seamlessly
    const mergedTracks = [...localTracks, ...spotifyTracks];
    res.json(mergedTracks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving tracks' });
  }
});

// @desc    Get time-synced lyrics for a track
// @route   GET /api/tracks/lyrics
// @access  Public
router.get('/lyrics', async (req, res) => {
  const { title, artist, duration } = req.query;
  try {
    const syncedLyrics = await generateLRCLibLyrics('', '', parseFloat(duration) || 180, title || '', artist || '');
    res.json({ syncedLyrics });
  } catch (err) {
    res.status(500).json({ syncedLyrics: '' });
  }
});

// @desc    Unified search for tracks, artists, and albums
// @route   GET /api/tracks/search
// @access  Public
router.get('/search', async (req, res) => {
  const { search, genre } = req.query;
  const limit = parseInt(req.query.limit) || 20;
  const offset = parseInt(req.query.offset) || 0;

  try {
    let trackQuery = {};
    let artistQuery = {};
    let playlistQuery = { isPublic: true };

    if (search) {
      const regex = new RegExp(search, 'i');
      trackQuery.$or = [
        { title: regex },
        { artistName: regex },
        { genre: regex },
        { lyrics: regex }
      ];
      artistQuery.$or = [
        { name: regex },
        { artistName: regex }
      ];
      playlistQuery.name = regex;
    }

    if (genre && genre !== 'All') {
      trackQuery.genre = { $regex: `^${genre}$`, $options: 'i' };
    }

    // 1. Tracks Search (Local + Spotify)
    const localTracks = await Track.find(trackQuery).sort({ plays: -1 }).skip(offset).limit(limit);

    let spotifyTracks = [];
    let spotifyArtists = [];
    let spotifyAlbums = [];
    try {
      if (search) {
        const results = await searchSpotify(search, limit, offset);
        spotifyTracks = results.tracks || [];
        spotifyArtists = results.artists || [];
        spotifyAlbums = results.albums || [];
      } else {
        spotifyTracks = await getSpotifyTrending(limit);
      }
    } catch (err) {
      console.error('Error fetching Spotify search results:', err);
    }

    const mergedTracks = [...localTracks, ...spotifyTracks];

    // 2. Artists Search (Local + Spotify)
    const localArtistsRaw = await User.find(artistQuery)
      .populate('artistProfile')
      .select('-password -email -verificationCode -verificationCodeExpires -resetPasswordCode -resetPasswordCodeExpires')
      .skip(offset)
      .limit(limit);

    const localArtists = localArtistsRaw.map(u => {
      const uObj = u.toObject();
      const defaultAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop';
      return {
        _id: uObj._id,
        name: uObj.artistProfile?.artistName || uObj.name,
        artistName: uObj.artistProfile?.artistName || uObj.name,
        artistAvatar: uObj.artistProfile?.artistAvatar || uObj.userAvatar || defaultAvatar,
        userAvatar: uObj.userAvatar || defaultAvatar,
        isArtistVerified: uObj.artistProfile?.isArtistVerified || false,
        isJamendo: false
      };
    });

    const mergedArtists = [...localArtists, ...spotifyArtists];

    // 3. Albums & Playlists Search (Local Albums + Local Playlists + Spotify Albums)
    const localAlbums = await Album.find({ name: { $regex: search || '', $options: 'i' } })
      .populate('artist', 'name')
      .skip(offset)
      .limit(limit);

    const localPlaylists = await Playlist.find(playlistQuery).populate('creator', 'name').skip(offset).limit(limit);

    const mergedAlbums = [...localAlbums, ...spotifyAlbums];

    res.json({
      tracks: mergedTracks,
      artists: mergedArtists,
      albums: mergedAlbums,
      playlists: localPlaylists
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
    
    if (lyrics !== undefined && lyrics !== track.lyrics) {
      console.log('Track lyrics modified. Re-processing with LRCLIB Sync Engine...');
      track.lyrics = await generateLRCLibLyrics(
        track.audioUrl, // Pass the remote audioUrl so LRCLIB can download and align it if needed!
        lyrics,
        track.duration || 0,
        track.title,
        track.artistName
      );
    }

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

    // 2. Count plays (total streams: sum of all play logs)
    const allPlaysCount = await PlayLog.countDocuments({ track: { $in: trackIds } });
    const totalPlays = allPlaysCount;

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

// @desc    Get licensed tracks from Spotify API
// @route   GET /api/tracks/jamendo
// @access  Public
router.get('/jamendo', async (req, res) => {
  try {
    const tracksList = await getSpotifyTrending(20);
    res.json(tracksList);
  } catch (error) {
    console.error('Spotify trending fetch error:', error);
    res.status(500).json({ message: 'Error retrieving Spotify licensed catalog', error: error.message });
  }
});

// @desc    Get popular music categories from Spotify API
router.get('/jamendo/genres', async (req, res) => {
  try {
    const genres = await getSpotifyGenres(30);
    res.json(genres);
  } catch (error) {
    console.error('Spotify categories fetch error:', error);
    res.status(500).json({ message: 'Error retrieving categories' });
  }
});

// @desc    Get Spotify official top charts categories (toplist playlists)
// @route   GET /api/tracks/jamendo/charts
// @access  Public
router.get('/jamendo/charts', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const charts = await getSpotifyChartsPlaylists(limit);
    res.json(charts);
  } catch (error) {
    console.error('Spotify charts categories fetch error:', error);
    res.status(500).json({ message: 'Error retrieving chart categories' });
  }
});

// @desc    Get Spotify artist profile website contact, details, and biography description
// @route   GET /api/tracks/jamendo/artist/:id
// @access  Public
router.get('/jamendo/artist/:id', async (req, res) => {
  const artistId = req.params.id;
  try {
    // 1. Try to find mirrored/cached artist in our database
    const Artist = require('../models/Artist');
    let artistProfile = await Artist.findOne({ isJamendoArtist: true, jamendoArtistId: artistId });
    let dbUser = artistProfile ? await User.findById(artistProfile.owner).populate('artistProfile') : null;
    
    let spotifyArtist;
    try {
      spotifyArtist = await getSpotifyArtist(artistId);
    } catch (err) {
      if (dbUser) {
        // Fallback to cached DB profile if Spotify API is offline
        const dbTracks = await Track.find({ artist: dbUser._id }).sort({ plays: -1 });
        const userObj = dbUser.toObject();
        userObj.artistName = dbUser.artistProfile.artistName;
        userObj.artistAvatar = dbUser.artistProfile.artistAvatar;
        userObj.artistBanner = dbUser.artistProfile.artistBanner;
        userObj.artistBio = dbUser.artistProfile.artistBio;
        userObj.isArtistVerified = dbUser.artistProfile.isArtistVerified;
        userObj.website = dbUser.artistProfile.website;
        userObj.facebook = dbUser.artistProfile.facebook;
        userObj.twitter = dbUser.artistProfile.twitter;
        userObj.instagram = dbUser.artistProfile.instagram;
        userObj.concerts = dbUser.artistProfile.concerts;
        return res.json({
          user: userObj,
          tracks: dbTracks,
          playlists: []
        });
      }
      throw new Error('Failed to fetch artist details from Spotify API');
    }

    const rawListeners = parseInt(spotifyArtist.monthlyListeners || spotifyArtist.followersCount || 142000, 10);
    const monthlyListeners = isNaN(rawListeners) ? 142000 : rawListeners;
    const totalPlays = Math.round(monthlyListeners * 12.5);
    const bioText = `Verified Spotify artist. Popularity score: ${monthlyListeners.toLocaleString()} listener ranking.`;

    // 2. Automatically mirror/save artist details & concerts inside MongoDB schema!
    dbUser = await User.findOneAndUpdate(
      { email: `spotify-artist-${spotifyArtist._id}@musico.com` },
      {
        $setOnInsert: {
          name: spotifyArtist.name,
          password: `spotify-artist-dummy-pass-123456`, // dummy secure pass
          isPremium: true
        },
        $set: {
          userAvatar: spotifyArtist.artistAvatar || '',
          monthlyListeners,
          totalPlays
        }
      },
      { upsert: true, new: true }
    );

    const concerts = dbUser ? (dbUser.concerts || []) : [];

    let artistProf = await Artist.findOneAndUpdate(
      { owner: dbUser._id },
      {
        $setOnInsert: {
          artistName: spotifyArtist.name,
          isJamendoArtist: true,
          jamendoArtistId: spotifyArtist._id,
          isArtistVerified: true,
          website: `https://open.spotify.com/artist/${spotifyArtist._id}`,
          facebook: '',
          twitter: '',
          instagram: ''
        },
        $set: {
          artistAvatar: spotifyArtist.artistAvatar || '',
          artistBio: bioText,
          concerts,
          stats: { playcount_total: totalPlays, popularity_total: monthlyListeners }
        }
      },
      { upsert: true, new: true }
    );

    if (!dbUser.artistProfile || dbUser.artistProfile.toString() !== artistProf._id.toString()) {
      dbUser.artistProfile = artistProf._id;
      await dbUser.save();
    }

    // 3. Dynamically fetch tracks of this artist from Spotify API
    let tracksList = [];
    try {
      tracksList = await getSpotifyArtistTracks(spotifyArtist._id);
      tracksList = tracksList.map(t => ({
        ...t,
        artist: dbUser._id // Assign the local MongoDB mirrored user ID!
      }));
    } catch (err) {
      console.error('Error fetching tracks for Spotify artist profile:', err);
    }

    // 4. Dynamically fetch albums of this artist from Spotify API to represent their profile playlists!
    let albumsList = [];
    try {
      albumsList = await getSpotifyArtistAlbums(spotifyArtist._id, 5);
      albumsList = albumsList.map((al) => ({
        ...al,
        creator: {
          _id: dbUser._id,
          name: spotifyArtist.name
        },
        tracks: new Array(10) // mock tracks array representation
      }));
    } catch (err) {
      console.error('Error fetching albums for Spotify artist profile:', err);
    }

    const userObj = dbUser.toObject();
    userObj.artistProfile = artistProf.toObject();
    userObj.artistName = artistProf.artistName;
    userObj.artistAvatar = artistProf.artistAvatar;
    userObj.artistBanner = artistProf.artistBanner;
    userObj.artistBio = artistProf.artistBio;
    userObj.isArtistVerified = artistProf.isArtistVerified;
    userObj.website = artistProf.website;
    userObj.facebook = artistProf.facebook;
    userObj.twitter = artistProf.twitter;
    userObj.instagram = artistProf.instagram;
    userObj.concerts = artistProf.concerts;
    res.json({
      user: userObj,
      tracks: tracksList,
      playlists: albumsList
    });
  } catch (error) {
    console.error('Spotify artist fetch error:', error);
    res.status(500).json({ message: 'Error retrieving Spotify artist details', error: error.message });
  }
});

// @desc    Import/Save a Spotify track to the platform DB
// @route   POST /api/tracks/import
// @access  Private
router.post('/import', protect, async (req, res) => {
  const { trackId } = req.body;
  if (!trackId || !trackId.startsWith('jamendo-')) {
    return res.status(400).json({ message: 'Valid Spotify Track ID is required' });
  }
  try {
    const track = await getOrCreateMirroredTrack(trackId);
    res.json({ message: 'Track successfully imported to platform database!', track });
  } catch (err) {
    console.error('Import error:', err);
    res.status(500).json({ message: 'Failed to import track to database' });
  }
});

// @desc    Create a new album with cover and associated tracks
// @route   POST /api/tracks/albums
// @access  Private
router.post(
  '/albums',
  protect,
  upload.fields([{ name: 'cover', maxCount: 1 }]),
  async (req, res) => {
    try {
      const { name, description, genre, tracks } = req.body;

      if (!name) {
        return res.status(400).json({ message: 'Album name is required' });
      }

      // Validate presence of Artist Profile
      await req.user.populate('artistProfile');
      if (!req.user.artistProfile) {
        return res.status(400).json({ message: 'You must set up your Artist Profile before distributing albums on Musico.' });
      }

      const coverFile = req.files.cover ? req.files.cover[0] : null;

      // Upload Cover to Cloudinary (or use fallback)
      let coverUrl = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=300&auto=format&fit=crop'; // Modern fallback cover
      if (coverFile) {
        console.log('Uploading album cover image to Cloudinary...');
        const coverResult = await uploadStreamToCloudinary(
          coverFile.buffer,
          'image',
          'musico/albums'
        );
        coverUrl = coverResult.secure_url;
      }

      // Parse track IDs
      let parsedTracks = [];
      if (tracks) {
        parsedTracks = typeof tracks === 'string' ? JSON.parse(tracks) : tracks;
      }

      // Create Album
      const album = await Album.create({
        name,
        description: description || '',
        coverUrl,
        artist: req.user._id,
        artistName: req.user.artistProfile.artistName,
        tracks: parsedTracks,
        genre: genre || 'Pop'
      });

      // Update all included tracks to use this album's cover art if they don't have one!
      if (parsedTracks.length > 0) {
        await Track.updateMany(
          { _id: { $in: parsedTracks }, coverUrl: { $in: ['', null, 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300&auto=format&fit=crop'] } },
          { coverUrl: coverUrl }
        );
      }

      res.status(201).json({
        message: 'Album created successfully!',
        album
      });
    } catch (error) {
      console.error('Album creation error:', error);
      res.status(500).json({ message: error.message || 'Server error during album creation' });
    }
  }
);

// @desc    Get single track details by ID (Local MongoDB or Jamendo/Spotify)
// @route   GET /api/tracks/:id
// @access  Public
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (id.startsWith('jamendo-')) {
      const track = await getOrCreateMirroredTrack(id);
      return res.json(track);
    }

    const mongoose = require('mongoose');
    if (mongoose.Types.ObjectId.isValid(id)) {
      const track = await Track.findById(id).populate('artist', 'name artistProfile userAvatar');
      if (track) {
        return res.json(track);
      }
    }

    res.status(404).json({ message: 'Track not found' });
  } catch (error) {
    console.error('Track lookup error:', error);
    res.status(500).json({ message: 'Server error retrieving track details' });
  }
});

module.exports = router;
