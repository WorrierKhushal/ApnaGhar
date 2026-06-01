const User = require('../models/User');
const Listing = require('../models/Listing');
const Booking = require('../models/Booking');

// @desc    Get aggregate platform statistics
// @route   GET /api/admin/stats
// @access  Private (Admin only)
const getAdminStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const hostsCount = await User.countDocuments({ role: 'host' });
    const listingsCount = await Listing.countDocuments();
    const bookingsCount = await Booking.countDocuments();

    // Sum overall platform revenue across all confirmed bookings
    const confirmedBookings = await Booking.find({ status: 'confirmed' });
    const cumulativeRevenue = confirmedBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        hostsCount,
        listingsCount,
        bookingsCount,
        cumulativeRevenue
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get registered users list
// @route   GET /api/admin/users
// @access  Private (Admin only)
const getAdminUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Transition user account role
// @route   PUT /api/admin/users/:id/role
// @access  Private (Admin only)
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!['user', 'host', 'admin'].includes(role)) {
      res.status(400);
      return next(new Error('Invalid user role target'));
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404);
      return next(new Error('User account not found'));
    }

    // Safety check: Prevent admin from demoting themselves
    if (user._id.toString() === req.user.id.toString() && role !== 'admin') {
      res.status(400);
      return next(new Error('Admins cannot demote themselves. Ask another administrator.'));
    }

    user.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User role transitioned to ${role} successfully`,
      data: {
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

// @desc    Delete user account registry
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin only)
const deleteUserAccount = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404);
      return next(new Error('User account not found'));
    }

    // Safety check: Prevent admin from deleting themselves
    if (user._id.toString() === req.user.id.toString()) {
      res.status(400);
      return next(new Error('Admins cannot remove their own accounts'));
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'User account removed successfully from the platform'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete listing stay by Admin moderation
// @route   DELETE /api/admin/listings/:id
// @access  Private (Admin only)
const deleteListingByAdmin = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      res.status(404);
      return next(new Error('Stay listing not found'));
    }

    await listing.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Stay listing moderated and removed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify host status
// @route   PUT /api/admin/users/:id/verify-host
// @access  Private (Admin only)
const verifyHostStatus = async (req, res, next) => {
  try {
    const { isVerifiedHost } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404);
      return next(new Error('User account not found'));
    }

    if (!user.hostDetails) {
      user.hostDetails = {};
    }
    user.hostDetails.isVerifiedHost = isVerifiedHost === true;
    await user.save();

    res.status(200).json({
      success: true,
      message: `Host verification status set to ${user.hostDetails.isVerifiedHost}`,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminStats,
  getAdminUsers,
  updateUserRole,
  deleteUserAccount,
  deleteListingByAdmin,
  verifyHostStatus
};
