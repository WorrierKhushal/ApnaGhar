const express = require('express');
const {
  signup,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  getMe,
  getHostStats,
  updateProfile
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.get('/host-stats', protect, getHostStats);

module.exports = router;
