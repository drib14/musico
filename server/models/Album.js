const mongoose = require('mongoose');

const albumSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide an album name'],
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
    artist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    artistName: {
      type: String,
      required: true,
    },
    tracks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Track',
      },
    ],
    genre: {
      type: String,
      default: 'Unknown',
      trim: true,
    },
    spotifyId: {
      type: String,
      default: '',
    },
    album_type: {
      type: String,
      default: 'album',
    },
    images: [
      {
        url: String,
        width: Number,
        height: Number
      }
    ],
    release_date: {
      type: String,
      default: '',
    },
    uri: {
      type: String,
      default: '',
    },
    total_tracks: {
      type: Number,
      default: 0,
    },
    available_markets: [String],
    external_urls: {
      spotify: { type: String, default: '' }
    },
    href: {
      type: String,
      default: '',
    },
    release_date_precision: {
      type: String,
      default: 'day',
    },
    type: {
      type: String,
      default: 'album',
    },
    artists: [
      {
        id: { type: String, default: '' },
        name: { type: String, default: '' },
        uri: { type: String, default: '' }
      }
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Album', albumSchema);
