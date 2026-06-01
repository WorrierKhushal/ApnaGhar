const Experience = require('../models/Experience');

// @desc    Get all experiences
// @route   GET /api/experiences
// @access  Public
const getExperiences = async (req, res, next) => {
  try {
    const { city, state, type } = req.query;
    const query = {};

    if (city) {
      query['location.city'] = new RegExp(city, 'i');
    }
    if (state) {
      query['location.state'] = new RegExp(state, 'i');
    }
    if (type) {
      query.type = type;
    }

    const experiences = await Experience.find(query).populate('host', 'name profilePicture hostDetails');

    res.status(200).json({
      success: true,
      count: experiences.length,
      data: experiences
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a regional local experience
// @route   POST /api/experiences
// @access  Private (Host or Admin only)
const createExperience = async (req, res, next) => {
  try {
    const {
      title,
      description,
      images,
      price,
      type,
      location,
      duration,
      listingId
    } = req.body;

    const newExperience = await Experience.create({
      title,
      description,
      images,
      price,
      type,
      location,
      duration,
      listing: listingId,
      host: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Native experience added successfully',
      data: newExperience
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getExperiences,
  createExperience
};
