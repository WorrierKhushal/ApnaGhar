const express = require('express');
const {
  createReview,
  getListingReviews,
  toggleHelpfulReview
} = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, createReview);
router.get('/listing/:listingId', getListingReviews);
router.post('/:id/helpful', protect, toggleHelpfulReview);

module.exports = router;
