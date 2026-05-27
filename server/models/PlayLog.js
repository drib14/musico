const mongoose = require('mongoose');

const playLogSchema = new mongoose.Schema(
  {
    track: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Track',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    city: {
      type: String,
      default: 'Unknown',
      trim: true,
    },
    country: {
      type: String,
      default: 'Unknown',
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true, // index for fast date filters
    },
  },
  {
    timestamps: false, // only createdAt is needed
  }
);

// Indexes for geo search aggregations
playLogSchema.index({ city: 1, createdAt: -1 });
playLogSchema.index({ country: 1, createdAt: -1 });

module.exports = mongoose.model('PlayLog', playLogSchema);
