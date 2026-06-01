const express = require('express');
const {
  getAdminStats,
  getAdminUsers,
  updateUserRole,
  deleteUserAccount,
  deleteListingByAdmin,
  verifyHostStatus
} = require('../controllers/adminController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply administrative protections across all route paths
router.use(protect, restrictTo('admin'));

router.get('/stats', getAdminStats);
router.get('/users', getAdminUsers);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/verify-host', verifyHostStatus);
router.delete('/users/:id', deleteUserAccount);
router.delete('/listings/:id', deleteListingByAdmin);

module.exports = router;
