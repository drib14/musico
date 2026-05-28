const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// 1. Standard Middlewares - CORS must be at the very top of the stack
const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
if (process.env.CLIENT_URL) {
  allowedOrigins.push(process.env.CLIENT_URL);
}

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// 2. Secure HTTP response headers with Helmet (configured to allow dynamic media assets streams)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://images.unsplash.com", "https://res.cloudinary.com", "*.cloudinary.com"],
      mediaSrc: ["'self'", "https://res.cloudinary.com", "*.cloudinary.com", "https://www.soundhelix.com"],
      connectSrc: ["'self'", "https://api.paymongo.com", "https://us1.locationiq.com", "https://api.cloudinary.com", "https://app.ticketmaster.com"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// 3. Protect backend API paths from high-frequency floodings (generous limit in dev to allow hot reloading)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' || !process.env.NODE_ENV ? 5000 : 100, // 5000 requests max in dev/local
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});
app.use('/api/', apiLimiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routing Prefix Attachments
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tracks', require('./routes/tracks'));
app.use('/api/playlists', require('./routes/playlists'));
app.use('/api/billing', require('./routes/billing'));

// Root Status Check Route
app.get('/status', (req, res) => {
  res.json({ status: 'active', platform: 'Musico Server', timestamp: new Date() });
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'An unexpected unhandled error occurred on the server',
    error: process.env.NODE_ENV === 'development' ? err.stack : {}
  });
});

const PORT = process.env.PORT || 5000;

// Listen only when not hosted as a serverless lambda function
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running in mode on port ${PORT}`);
    console.log(`Endpoint health status: http://localhost:${PORT}/status`);
  });
}

module.exports = app;
