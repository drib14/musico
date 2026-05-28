const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationCode: {
      type: String,
      default: null,
    },
    verificationCodeExpires: {
      type: Date,
      default: null,
    },
    resetPasswordCode: {
      type: String,
      default: null,
    },
    resetPasswordCodeExpires: {
      type: Date,
      default: null,
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    userAvatar: {
      type: String,
      default: '',
    },
    artistName: {
      type: String,
      default: '',
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
    monthlyListeners: {
      type: Number,
      default: 0,
    },
    totalPlays: {
      type: Number,
      default: 0,
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
    likedTracks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Track',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
