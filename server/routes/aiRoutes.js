const express = require('express');
const {
  generateItinerary,
  chatWithAssistant,
  predictTravelCost
} = require('../controllers/aiController');

const router = express.Router();

router.post('/planner', generateItinerary);
router.post('/chat', chatWithAssistant);
router.post('/predict-cost', predictTravelCost);

module.exports = router;
