const express = require('express');
const {
  getListings,
  getListingById,
  createListing,
  updateListing,
  deleteListing
} = require('../controllers/listingController');
const { protect, getOptionalUser } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
  .get(getOptionalUser, getListings)
  .post(protect, createListing);

router.route('/:id')
  .get(getOptionalUser, getListingById)
  .put(protect, updateListing)
  .delete(protect, deleteListing);

module.exports = router;
