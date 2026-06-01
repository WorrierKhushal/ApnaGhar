const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path'); // Added path module for production serving

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorMiddleware');
const authRoutes = require('./routes/authRoutes');
const listingRoutes = require('./routes/listingRoutes');
const experienceRoutes = require('./routes/experienceRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const adminRoutes = require('./routes/adminRoutes');
const aiRoutes = require('./routes/aiRoutes');

// Load environment configurations
dotenv.config();

// Establish MongoDB connection
connectDB();

const app = express();

// Security HTTP Headers with Content Security Policy (CSP)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: [
        "'self'",
        "data:",
        "https://images.unsplash.com",
        "https://*.unsplash.com",
        "https://images.pexels.com",
        "https://*.pexels.com",
        "https://*.tile.openstreetmap.org"
      ],
      connectSrc: [
        "'self'",
        "http://localhost:5000",
        "http://localhost:5173",
        "http://localhost:11434"
      ]
    }
  }
}));

// Cross-Origin Resource Sharing
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Body parser with increased limits for image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Cookie parsing
app.use(cookieParser());

// Throttling Rate Limiting (200 requests per 15 minutes)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiter to API routes
app.use('/api', limiter);

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/experiences', experienceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/wishlists', wishlistRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);

// --- START OF PRODUCTION STATIC SERVING ---
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the React frontend build
  app.use(express.static(path.join(__dirname, '../client/dist')));

  // For any route that doesn't match an API route, send back index.html
  app.get('*', (req, res, next) => {
    // Skip if the request is an API request that wasn't caught by the routes above
    if (req.url.startsWith('/api')) return next();

    res.sendFile(path.resolve(__dirname, '../client', 'dist', 'index.html'));
  });
}
// --- END OF PRODUCTION STATIC SERVING ---

// Server status endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AapnaGhar API Server is running healthily',
    timestamp: new Date()
  });
});

// Route Catch-All Fallback (404 Not Found for /api routes)
app.use('/api', (req, res, next) => {
  const error = new Error(`Resource Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
});

// Global Error Handler Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`AapnaGhar server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
  server.close(() => process.exit(1));
});