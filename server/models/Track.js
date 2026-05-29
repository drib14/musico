const mongoose = require('mongoose');

const trackSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a track title'],
      trim: true,
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
    audioUrl: {
      type: String,
      required: [true, 'Please provide the audio URL'],
    },
    coverUrl: {
      type: String,
      default: '', // will default to a fallback album art if empty
    },
    duration: {
      type: Number,
      default: 0, // duration in seconds
    },
    genre: {
      type: String,
      default: 'Unknown',
      trim: true,
    },
    plays: {
      type: Number,
      default: 0,
    },
    lyrics: {
      type: String,
      default: '',
    },
    isJamendo: {
      type: Boolean,
      default: false,
    },
    jamendoArtistId: {
      type: String,
      default: '',
    },
    jamendoTrackId: {
      type: String,
      default: '',
    },
    contributors: {
      mainVocalist: { type: String, default: '' },
      composer: { type: String, default: '' },
      lyricist: { type: String, default: '' },
      producer: { type: String, default: '' },
    },
    musicinfo: {
      vocalinstrumental: { type: String, default: '' },
      lang: { type: String, default: '' },
      gender: { type: String, default: '' },
      acousticelectric: { type: String, default: '' },
      speed: { type: String, default: '' },
      tags: {
        genres: [String],
        instruments: [String],
        vartags: [String],
      }
    },
    stats: {
      playcount_total: { type: Number, default: 0 },
      downloadcount_total: { type: Number, default: 0 },
      popularity_total: { type: Number, default: 0 }
    },
    audiodownload: { type: String, default: '' }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Track', trackSchema);
