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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Album', albumSchema);
