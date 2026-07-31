const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a playlist name'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    coverUrl: {
      type: String,
      default: '',
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tracks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Track',
      },
    ],
    isPublic: {
      type: Boolean,
      default: true,
    },
    spotifyId: {
      type: String,
      default: '',
    },
    collaborative: {
      type: Boolean,
      default: false,
    },
    external_urls: {
      spotify: { type: String, default: '' }
    },
    spotifyFollowers: {
      href: { type: String, default: '' },
      total: { type: Number, default: 0 }
    },
    href: {
      type: String,
      default: '',
    },
    images: [
      {
        url: String,
        width: Number,
        height: Number
      }
    ],
    owner: {
      id: { type: String, default: '' },
      display_name: { type: String, default: '' },
      uri: { type: String, default: '' }
    },
    snapshot_id: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      default: 'playlist',
    },
    uri: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Playlist', playlistSchema);
