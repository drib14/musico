const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    ticketmasterId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide event name'],
      trim: true,
    },
    artists: [
      {
        id: String,
        name: String,
        image: String,
      },
    ],
    venue: {
      id: String,
      name: String,
      address: String,
      city: String,
      state: String,
      country: String,
      postalCode: String,
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },
    dates: {
      startDate: Date,
      startTime: String,
      endDate: Date,
      timezone: String,
    },
    priceRange: {
      min: Number,
      max: Number,
      currency: String,
    },
    image: {
      type: String,
      default: '',
    },
    url: {
      type: String,
      required: true,
    },
    ticketsUrl: String,
    status: {
      type: String,
      enum: ['onsale', 'presale', 'offsale', 'cancelled', 'postponed'],
      default: 'onsale',
    },
    classification: {
      segment: String,
      genre: String,
      subGenre: String,
      type: String,
      subType: String,
    },
    promoter: {
      id: String,
      name: String,
    },
    source: {
      type: String,
      default: 'ticketmaster',
    },
    lastFetched: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for quick lookups
eventSchema.index({ 'artists.name': 1 });
eventSchema.index({ 'dates.startDate': 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ lastFetched: 1 });

module.exports = mongoose.model('Event', eventSchema);
