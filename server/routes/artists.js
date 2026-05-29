const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const Artist = require('../models/Artist');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

const storage = multer.memoryStorage();
const upload = multer({ storage });

const uploadStreamToCloudinary = (fileBuffer, resourceType, folderName) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: resourceType, folder: folderName },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

// @desc Create or Update Artist Profile
// @route POST /api/artists
// @access Private
router.post(
  '/',
  protect,
  upload.fields([
    { name: 'artistAvatar', maxCount: 1 },
    { name: 'artistBanner', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const { artistName, artistBio, website, facebook, twitter, instagram, concerts } = req.body;
      let artist = await Artist.findOne({ owner: req.user._id });

      let parsedConcerts = [];
      if (concerts) {
         parsedConcerts = typeof concerts === 'string' ? JSON.parse(concerts) : concerts;
      }

      let avatarUrl = artist?.artistAvatar || '';
      let bannerUrl = artist?.artistBanner || '';

      if (req.files?.artistAvatar) {
        const resAv = await uploadStreamToCloudinary(req.files.artistAvatar[0].buffer, 'image', 'musico/artists');
        avatarUrl = resAv.secure_url;
      }
      if (req.files?.artistBanner) {
        const resBan = await uploadStreamToCloudinary(req.files.artistBanner[0].buffer, 'image', 'musico/banners');
        bannerUrl = resBan.secure_url;
      }

      if (artist) {
        artist.artistName = artistName || artist.artistName;
        artist.artistBio = artistBio !== undefined ? artistBio : artist.artistBio;
        artist.website = website !== undefined ? website : artist.website;
        artist.facebook = facebook !== undefined ? facebook : artist.facebook;
        artist.twitter = twitter !== undefined ? twitter : artist.twitter;
        artist.instagram = instagram !== undefined ? instagram : artist.instagram;
        artist.artistAvatar = avatarUrl;
        artist.artistBanner = bannerUrl;
        artist.concerts = parsedConcerts.length ? parsedConcerts : artist.concerts;
        await artist.save();
      } else {
        artist = await Artist.create({
          owner: req.user._id,
          artistName,
          artistBio: artistBio || '',
          website: website || '',
          facebook: facebook || '',
          twitter: twitter || '',
          instagram: instagram || '',
          artistAvatar: avatarUrl,
          artistBanner: bannerUrl,
          concerts: parsedConcerts
        });

        // Link Artist to User
        const user = await User.findById(req.user._id);
        user.artistProfile = artist._id;
        await user.save();
      }

      res.status(200).json({ message: 'Artist profile saved', artist });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error saving artist profile' });
    }
  }
);

module.exports = router;
