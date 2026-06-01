const express = require('express');
const {
  getExperiences,
  createExperience
} = require('../controllers/experienceController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
  .get(getExperiences)
  .post(protect, restrictTo('host', 'admin'), createExperience);

module.exports = router;
