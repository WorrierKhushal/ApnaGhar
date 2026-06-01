const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { signupSchema, loginSchema } = require('../validation/authValidation');

// Token signing helpers
const signAccessToken = (userId) => {
  return jwt.sign(
    { id: userId }, 
    process.env.JWT_ACCESS_SECRET, 
    { expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m' }
  );
};

const signRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId }, 
    process.env.JWT_REFRESH_SECRET, 
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  );
};

// Set secure refresh token cookie
const setRefreshTokenCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', // Lax matches client/server domains communication
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days matching refresh token duration
  });
};

exports.signup = async (req, res, next) => {
  try {
    // Validate inputs
    const { error, value } = signupSchema.validate(req.body);
    if (error) {
      res.status(400);
      return next(new Error(error.details[0].message));
    }

    const { name, email, password, phoneNumber, role } = value;

    // Check email uniqueness
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      return next(new Error('Email is already registered'));
    }

    // Salt & Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user registry
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phoneNumber,
      role
    });

    res.status(201).json({
      success: true,
      message: 'Account registered successfully. Check email for verification token.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    // Validate inputs
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      res.status(400);
      return next(new Error(error.details[0].message));
    }

    const { email, password } = value;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401);
      return next(new Error('Invalid email or password'));
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401);
      return next(new Error('Invalid email or password'));
    }

    // Sign tokens
    const accessToken = signAccessToken(user._id);
    const refreshToken = signRefreshToken(user._id);

    // Save refresh token reference to user database row
    user.refreshToken = refreshToken;
    await user.save();

    // Set cookie
    setRefreshTokenCookie(res, refreshToken);

    res.status(200).json({
      success: true,
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture
      }
    });

  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;

    if (refreshToken) {
      // Find user and clear active DB refresh token
      const user = await User.findOne({ refreshToken });
      if (user) {
        user.refreshToken = undefined;
        await user.save();
      }
    }

    // Clear client cookies
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    next(error);
  }
};

exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      res.status(401);
      return next(new Error('Session expired, please login again'));
    }

    // Verify token signature
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Match with user registry
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      res.status(401);
      return next(new Error('Invalid session, please login again'));
    }

    // Issue a new access token
    const accessToken = signAccessToken(user._id);

    res.status(200).json({
      success: true,
      accessToken
    });

  } catch (error) {
    res.status(401);
    return next(new Error('Session invalid, please login again'));
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      res.status(404);
      return next(new Error('No account found with that email address'));
    }

    // Generate random reset token
    const resetToken = require('crypto').randomBytes(20).toString('hex');
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = Date.now() + 3600000; // 1 hour expiry
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset link sent (Simulated). Use token value to submit reset requests.',
      resetToken // Returned directly for testing simulation
    });

  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      res.status(400);
      return next(new Error('Invalid or expired reset token'));
    }

    // Salt and hash the new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    
    // Invalidate refresh tokens on password change
    user.refreshToken = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset completed. Log in using new credentials.'
    });

  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phoneNumber, profilePicture } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }

    if (name) user.name = name;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    if (profilePicture) user.profilePicture = profilePicture;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phoneNumber: user.phoneNumber,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get host statistics and recalculate trust score
// @route   GET /api/auth/host-stats
// @access  Private (Host or Admin)
exports.getHostStats = async (req, res, next) => {
  try {
    const Listing = require('../models/Listing');
    const Booking = require('../models/Booking');

    // 1. Fetch stays owned by host
    const hostStays = await Listing.find({ host: req.user.id });
    const stayIds = hostStays.map(s => s._id);

    // 2. Aggregate statistics
    const listingsCount = hostStays.length;
    const pendingCount = await Booking.countDocuments({ listing: { $in: stayIds }, status: 'pending' });
    const confirmedCount = await Booking.countDocuments({ listing: { $in: stayIds }, status: 'confirmed' });
    const cancelledCount = await Booking.countDocuments({ listing: { $in: stayIds }, status: 'cancelled' });

    // Sum total revenue from confirmed reservations
    const confirmedBookings = await Booking.find({ listing: { $in: stayIds }, status: 'confirmed' });
    const totalEarnings = confirmedBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    // 3. Dynamic Host Trust Score Calculation
    let trustScore = 95; // base trust score
    
    // Penalize for cancellations (-5% per cancellation)
    trustScore -= (cancelledCount * 5);

    // Minor penalty for pending responses (-2% per pending)
    trustScore -= (pendingCount * 2);

    // Reward for active confirmed bookings (+1% per confirmed, maxing at 100%)
    trustScore += (confirmedCount * 1);

    // Ensure within standard bounds [60% to 100%]
    trustScore = Math.max(60, Math.min(100, trustScore));

    // Write updated trust score back to host user document profile
    const hostUser = await User.findById(req.user.id);
    if (hostUser) {
      if (!hostUser.hostDetails) {
        hostUser.hostDetails = {};
      }
      hostUser.hostDetails.trustScore = trustScore;
      await hostUser.save();
    }

    res.status(200).json({
      success: true,
      data: {
        listingsCount,
        pendingCount,
        confirmedCount,
        totalEarnings,
        trustScore
      }
    });
  } catch (error) {
    next(error);
  }
};
