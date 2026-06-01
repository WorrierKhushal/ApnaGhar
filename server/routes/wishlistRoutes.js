const express = require('express');
const {
  toggleWishlist,
  getWishlist
} = require('../controllers/wishlistController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.post('/toggle', toggleWishlist);
router.get('/', getWishlist);

module.exports = router;
