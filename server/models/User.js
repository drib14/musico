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
      required: [function() { return !this.spotifyId; }, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    spotifyId: {
      type: String,
      unique: true,
      sparse: true,
    },
    spotifyUrl: {
      type: String,
      default: '',
    },
    spotifyAccessToken: {
      type: String,
      default: '',
    },
    spotifyRefreshToken: {
      type: String,
      default: '',
    },
    spotifyTokenExpiresAt: {
      type: Date,
      default: null,
    },
    country: {
      type: String,
      default: '',
    },
    product: {
      type: String,
      default: '',
    },
    display_name: {
      type: String,
      default: '',
    },
    external_urls: {
      spotify: { type: String, default: '' },
    },
    href: {
      type: String,
      default: '',
    },
    images: [
      {
        url: String,
        width: Number,
        height: Number,
      }
    ],
    type: {
      type: String,
      default: 'user',
    },
    uri: {
      type: String,
      default: '',
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
    artistProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artist',
      default: null,
    },
    monthlyListeners: {
      type: Number,
      default: 0,
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    totalPlays: {
      type: Number,
      default: 0,
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
