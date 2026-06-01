const express = require('express');
const {
  createBooking,
  getUserBookings,
  getHostBookings,
  getBookings,
  updateBookingStatus,
  submitPaymentReceipt,
  getBookingById
} = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All booking endpoints require active authentication
router.use(protect);

router.route('/')
  .post(createBooking)
  .get(getBookings);

router.get('/user', getUserBookings);
router.get('/host', getHostBookings);
router.get('/:id', getBookingById);
router.put('/:id/submit-payment', submitPaymentReceipt);

// Host/Admin reservation management paths (available to any authenticated user who has listed stays)
router.put('/:id/status', updateBookingStatus);

module.exports = router;
