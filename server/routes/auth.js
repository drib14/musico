const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const { sendVerificationEmail, sendResetPasswordEmail } = require('../utils/mailer');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max image size
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

// Helper to generate 6-digit code
const generate6DigitCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Helper to generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const verificationCode = generate6DigitCode();
    const verificationCodeExpires = Date.now() + 15 * 60 * 1000; // 15 mins

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      isVerified: false,
      verificationCode,
      verificationCodeExpires,
    });

    if (user) {
      // Send verification email
      try {
        await sendVerificationEmail(user.email, verificationCode, user.name);
      } catch (err) {
        console.error('Email send failure:', err);
      }

      res.status(201).json({
        message: 'Registration successful! Verification code sent to email.',
        email: user.email,
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// @desc    Verify verification code
// @route   POST /api/auth/verify-email
// @access  Public
router.post('/verify-email', async (req, res) => {
  const { email, code } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    if (user.verificationCode !== code || user.verificationCodeExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    // Verify user
    user.isVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpires = null;
    await user.save();
    await user.populate('likedTracks');

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isVerified: user.isVerified,
      isPremium: user.isPremium,
      likedTracks: user.likedTracks,
      token: generateToken(user._id),
      message: 'Account successfully verified!',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during verification' });
  }
});

// @desc    Resend registration verification code
// @route   POST /api/auth/resend-verification
// @access  Public
router.post('/resend-verification', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    const verificationCode = generate6DigitCode();
    user.verificationCode = verificationCode;
    user.verificationCodeExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    await sendVerificationEmail(user.email, verificationCode, user.name);

    res.json({ message: 'A new 6-digit verification code has been sent to your email.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during verification resend' });
  }
});

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user with password selected
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if email is verified
    if (!user.isVerified) {
      // Re-send verification code if expired or just to make sure they get one
      const verificationCode = generate6DigitCode();
      user.verificationCode = verificationCode;
      user.verificationCodeExpires = Date.now() + 15 * 60 * 1000;
      await user.save();

      try {
        await sendVerificationEmail(user.email, verificationCode, user.name);
      } catch (err) {
        console.error('Email send failure:', err);
      }

      return res.status(403).json({
        message: 'Account not verified. A verification code has been sent to your email.',
        unverified: true,
        email: user.email,
      });
    }

    const populatedUser = await User.findById(user._id).populate('likedTracks');

    res.json({
      _id: populatedUser._id,
      name: populatedUser.name,
      email: populatedUser.email,
      isVerified: populatedUser.isVerified,
      isPremium: populatedUser.isPremium,
      likedTracks: populatedUser.likedTracks,
      token: generateToken(populatedUser._id),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @desc    Forgot password trigger
// @route   POST /api/auth/forgot-password
// @access  Public
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'No user registered with this email' });
    }

    const resetPasswordCode = generate6DigitCode();
    user.resetPasswordCode = resetPasswordCode;
    user.resetPasswordCodeExpires = Date.now() + 15 * 60 * 1000; // 15 mins
    await user.save();

    await sendResetPasswordEmail(user.email, resetPasswordCode, user.name);

    res.json({
      message: 'Reset confirmation code sent to email.',
      email: user.email,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during forgot-password trigger' });
  }
});

// @desc    Verify reset password code
// @route   POST /api/auth/verify-reset-code
// @access  Public
router.post('/verify-reset-code', async (req, res) => {
  const { email, code } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.resetPasswordCode !== code || user.resetPasswordCodeExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired confirmation code' });
    }

    res.json({
      message: 'Code verified successfully. You may now reset your password.',
      email: user.email,
      code: code,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during code verification' });
  }
});

// @desc    Reset password with verified code
// @route   POST /api/auth/reset-password
// @access  Public
router.post('/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.resetPasswordCode !== code || user.resetPasswordCodeExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired recovery session' });
    }

    // Set new password
    user.password = newPassword;
    user.resetPasswordCode = null;
    user.resetPasswordCodeExpires = null;
    await user.save();

    res.json({ message: 'Password has been reset successfully! You can now log in.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during password reset' });
  }
});

// @desc    Get user profile data
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password').populate('likedTracks');
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching user details' });
  }
});

// @desc    Update user profile settings
// @route   PUT /api/auth/profile
// @access  Private
router.put(
  '/profile',
  protect,
  upload.fields([
    { name: 'userAvatar', maxCount: 1 },
    { name: 'artistAvatar', maxCount: 1 },
    { name: 'artistBanner', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const user = await User.findById(req.user._id).select('+password');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const { name, email, password, artistName, artistBio, isArtistVerified, website, facebook, twitter, instagram } = req.body;

      // Check email availability
      if (email && email !== user.email) {
        const emailExists = await User.findOne({ email });
        if (emailExists) {
          return res.status(400).json({ message: 'Email address already in use by another account' });
        }
        user.email = email;
      }

      if (name) user.name = name;
      if (password) user.password = password; // pre-save will automatically hash it!

      // Update Artist Fields
      if (artistName !== undefined) user.artistName = artistName;
      if (artistBio !== undefined) user.artistBio = artistBio;
      if (isArtistVerified !== undefined) {
        user.isArtistVerified = isArtistVerified === 'true' || isArtistVerified === true;
      }
      if (website !== undefined) user.website = website;
      if (facebook !== undefined) user.facebook = facebook;
      if (twitter !== undefined) user.twitter = twitter;
      if (instagram !== undefined) user.instagram = instagram;
      if (req.body.artistAvatar !== undefined) user.artistAvatar = req.body.artistAvatar;
      if (req.body.artistBanner !== undefined) user.artistBanner = req.body.artistBanner;
      if (req.body.userAvatar !== undefined) user.userAvatar = req.body.userAvatar;
      if (req.body.concerts !== undefined) {
        user.concerts = typeof req.body.concerts === 'string' ? JSON.parse(req.body.concerts) : req.body.concerts;
      }


      // Handle Image uploads to Cloudinary
      if (req.files) {
        if (req.files.userAvatar) {
          console.log('Uploading user avatar to Cloudinary...');
          const result = await uploadStreamToCloudinary(
            req.files.userAvatar[0].buffer,
            'image',
            'musico/avatars'
          );
          user.userAvatar = result.secure_url;
        }

        if (req.files.artistAvatar) {
          console.log('Uploading artist avatar to Cloudinary...');
          const result = await uploadStreamToCloudinary(
            req.files.artistAvatar[0].buffer,
            'image',
            'musico/artists'
          );
          user.artistAvatar = result.secure_url;
        }

        if (req.files.artistBanner) {
          console.log('Uploading artist banner to Cloudinary...');
          const result = await uploadStreamToCloudinary(
            req.files.artistBanner[0].buffer,
            'image',
            'musico/banners'
          );
          user.artistBanner = result.secure_url;
        }
      }

      await user.save();

      // Refetch without password
      const updatedUser = await User.findById(user._id).select('-password').populate('likedTracks');
      res.json({
        message: 'Profile updated successfully!',
        user: updatedUser,
        token: generateToken(updatedUser._id) // issue fresh token in case email changed
      });
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({ message: 'Server error during profile update' });
    }
  }
);

// @desc    Get public user/artist profile details
// @route   GET /api/auth/users/:id
// @access  Public
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -email -verificationCode -verificationCodeExpires -resetPasswordCode -resetPasswordCodeExpires');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Fetch tracks uploaded by this artist
    const Track = require('../models/Track');
    const Playlist = require('../models/Playlist');
    const PlayLog = require('../models/PlayLog');

    const tracks = await Track.find({ artist: user._id }).sort({ createdAt: -1 });
    const trackIds = tracks.map(t => t._id);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const uniqueMonthlyUsers = await PlayLog.distinct('user', {
      track: { $in: trackIds },
      createdAt: { $gte: thirtyDaysAgo },
      user: { $ne: null }
    });
    const monthlyListeners = uniqueMonthlyUsers.length;

    // totalPlays calculation according to requirements: Total Streams = sum of all plays
    const allPlays = await PlayLog.countDocuments({
      track: { $in: trackIds }
    });
    const totalPlays = allPlays;

    const userObj = user.toObject();
    userObj.monthlyListeners = monthlyListeners || 0;
    userObj.totalPlays = totalPlays || 0;
    userObj.website = userObj.website || `https://www.musico.com/artist/${userObj._id}`;
    userObj.facebook = userObj.facebook || `https://facebook.com/${(userObj.artistName || userObj.name).replace(/\s+/g, '').toLowerCase()}`;
    userObj.twitter = userObj.twitter || `https://twitter.com/${(userObj.artistName || userObj.name).replace(/\s+/g, '').toLowerCase()}`;
    userObj.instagram = userObj.instagram || `https://instagram.com/${(userObj.artistName || userObj.name).replace(/\s+/g, '').toLowerCase()}`;
    userObj.concerts = userObj.concerts || [];


    // Fetch public playlists created by this user
    const playlists = await Playlist.find({ creator: user._id, isPublic: true }).sort({ createdAt: -1 });

    res.json({
      user: userObj,
      tracks,
      playlists
    });
  } catch (error) {
    console.error('Public profile fetch error:', error);
    res.status(500).json({ message: 'Server error fetching profile details' });
  }
});

// @desc    Get top verified artists / creators
// @route   GET /api/auth/artists/top
// @access  Public
router.get('/artists/top', async (req, res) => {
  const clientId = process.env.JAMENDO_CLIENT_ID || '444d4f6c';
  try {
    const Track = require('../models/Track');

    // Find all users who have set up an artist profile
    const artists = await User.find({ artistName: { $ne: '' } }).select('-password -email -verificationCode -verificationCodeExpires -resetPasswordCode -resetPasswordCodeExpires');

    // Aggregate streams dynamically for each artist
    const localWithStats = await Promise.all(artists.map(async (art) => {
      const PlayLog = require('../models/PlayLog');
      const tracks = await Track.find({ artist: art._id });
      const trackIds = tracks.map(t => t._id);
      const totalPlays = await PlayLog.countDocuments({
        track: { $in: trackIds }
      });
      const artObj = art.toObject();
      artObj.totalPlays = totalPlays;
      artObj.tracksCount = tracks.length;
      return artObj;
    }));

    // Fetch popular Jamendo artists
    let jamendoArtists = [];
    try {
      const jamArtistUrl = `https://api.jamendo.com/v3.0/artists/?client_id=${clientId}&format=json&limit=10&order=popularity_total`;
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
          totalPlays: a.stats?.playcount_total || 120000,
          tracksCount: 15
        }));
      }
    } catch (err) {
      console.error('Error fetching Jamendo top artists:', err);
    }

    const mergedArtists = [...localWithStats, ...jamendoArtists];

    // Sort by total plays descending
    mergedArtists.sort((a, b) => b.totalPlays - a.totalPlays);

    res.json(mergedArtists.slice(0, 12)); // return top 12
  } catch (error) {
    console.error('Top artists fetch error:', error);
    res.status(500).json({ message: 'Server error retrieving top artists' });
  }
});

// @desc    Toggle follow status for a user/artist
// @route   POST /api/auth/users/:id/follow
// @access  Private
router.post('/users/:id/follow', protect, async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;

    if (targetUserId === currentUserId.toString()) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const isFollowing = currentUser.following.includes(targetUserId);

    if (isFollowing) {
      // Unfollow
      currentUser.following.pull(targetUserId);
      targetUser.followers.pull(currentUserId);
    } else {
      // Follow
      currentUser.following.push(targetUserId);
      targetUser.followers.push(currentUserId);
    }

    await currentUser.save();
    await targetUser.save();

    res.json({
      message: isFollowing ? "Unfollowed successfully" : "Followed successfully",
      isFollowing: !isFollowing,
      followersCount: targetUser.followers.length,
      followingCount: targetUser.following.length
    });
  } catch (error) {
    console.error('Follow toggle error:', error);
    res.status(500).json({ message: 'Server error during follow toggle' });
  }
});

module.exports = router;
