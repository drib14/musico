const mongoose = require('mongoose');

const artistSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true // A user can only own one artist profile
    },
    artistName: {
      type: String,
      required: [true, 'Please provide an artist name'],
      trim: true,
    },
    artistAvatar: {
      type: String,
      default: '',
    },
    artistBanner: {
      type: String,
      default: '',
    },
    artistBio: {
      type: String,
      default: '',
      trim: true,
    },
    isArtistVerified: {
      type: Boolean,
      default: false,
    },
    website: {
      type: String,
      default: '',
    },
    facebook: {
      type: String,
      default: '',
    },
    twitter: {
      type: String,
      default: '',
    },
    instagram: {
      type: String,
      default: '',
    },
    concerts: [
      {
        date: { type: String, default: '' },
        city: { type: String, default: '' },
        venue: { type: String, default: '' },
        title: { type: String, default: '' },
        url: { type: String, default: '' },
      }
    ],
    isJamendoArtist: {
      type: Boolean,
      default: false,
    },
    jamendoArtistId: {
      type: String,
      default: '',
    },
    // Jamendo parity structure
    stats: {
      playcount_total: { type: Number, default: 0 },
      popularity_total: { type: Number, default: 0 }
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Artist', artistSchema);
