const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Listing = require('../models/Listing');

// @desc    Submit a review for a stay listing
// @route   POST /api/reviews
// @access  Private (Traveler/Guest)
const createReview = async (req, res, next) => {
  try {
    const {
      listingId,
      ratings,
      comment
    } = req.body;

    const { cleanliness, communication, location, value, localVibe } = ratings || {};

    // 1. Check if ratings are within valid ranges (1 to 5)
    const ratingValues = [cleanliness, communication, location, value, localVibe];
    const invalidRating = ratingValues.some(val => isNaN(val) || val < 1 || val > 5);

    if (invalidRating) {
      res.status(400);
      return next(new Error('All ratings (cleanliness, communication, location, value, local vibe) must be numbers between 1 and 5'));
    }

    // 2. Booking verification: User must have a booking for this listing
    const booking = await Booking.findOne({
      user: req.user.id,
      listing: listingId,
      status: { $in: ['confirmed', 'completed'] }
    });

    if (!booking) {
      res.status(400);
      return next(new Error('You must have a confirmed or completed stay booking to submit a review'));
    }

    // 3. Prevent duplicate reviews for the same booking
    const duplicateReview = await Review.findOne({
      booking: booking._id,
      user: req.user.id
    });

    if (duplicateReview) {
      res.status(400);
      return next(new Error('You have already submitted a review for this stay booking'));
    }

    // 4. Calculate overall rating average
    const overallRating = Number(
      (ratingValues.reduce((sum, rating) => sum + Number(rating), 0) / ratingValues.length).toFixed(2)
    );

    // 5. Create Review
    const review = await Review.create({
      listing: listingId,
      user: req.user.id,
      booking: booking._id,
      ratings: {
        cleanliness: Number(cleanliness),
        communication: Number(communication),
        location: Number(location),
        value: Number(value),
        localVibe: Number(localVibe)
      },
      overallRating,
      comment
    });

    // Log review interaction in DB (weight = 4.0 * overallRating / 5.0)
    const Interaction = require('../models/Interaction');
    const reviewWeight = 4.0 * (overallRating / 5.0);
    await Interaction.findOneAndUpdate(
      { user: req.user.id, listing: listingId, interactionType: 'review' },
      { user: req.user.id, listing: listingId, interactionType: 'review', weight: reviewWeight, timestamp: new Date() },
      { upsert: true, new: true }
    );

    // 6. Recalculate stay safety indicators / safetyIndex & rating averages
    const allReviews = await Review.find({ listing: listingId });
    const listingRatingSum = allReviews.reduce((sum, r) => sum + r.overallRating, 0);
    const avgRating = allReviews.length > 0 ? (listingRatingSum / allReviews.length) : 8.5;
    
    // Scale 1-5 stars to 1-10 safety index scale
    const newSafetyIndex = Number((avgRating * 2).toFixed(1));

    await Listing.findByIdAndUpdate(listingId, {
      'safetyIndicators.safetyIndex': newSafetyIndex
    });

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: review
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reviews for a listing
// @route   GET /api/reviews/listing/:listingId
// @access  Public
const getListingReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ listing: req.params.listingId })
      .populate('user', 'name profilePicture')
      .sort({ createdAt: -1 });

    // Calculate rating averages across sub-categories
    let cleanlinessSum = 0, communicationSum = 0, locationSum = 0, valueSum = 0, localVibeSum = 0;
    
    reviews.forEach(r => {
      cleanlinessSum += r.ratings.cleanliness;
      communicationSum += r.ratings.communication;
      locationSum += r.ratings.location;
      valueSum += r.ratings.value;
      localVibeSum += r.ratings.localVibe;
    });

    const reviewsCount = reviews.length;
    const categoryAverages = {
      cleanliness: reviewsCount > 0 ? Number((cleanlinessSum / reviewsCount).toFixed(2)) : 0,
      communication: reviewsCount > 0 ? Number((communicationSum / reviewsCount).toFixed(2)) : 0,
      location: reviewsCount > 0 ? Number((locationSum / reviewsCount).toFixed(2)) : 0,
      value: reviewsCount > 0 ? Number((valueSum / reviewsCount).toFixed(2)) : 0,
      localVibe: reviewsCount > 0 ? Number((localVibeSum / reviewsCount).toFixed(2)) : 0
    };

    res.status(200).json({
      success: true,
      count: reviewsCount,
      categoryAverages,
      data: reviews
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Vote review as helpful / remove vote
// @route   POST /api/reviews/:id/helpful
// @access  Private (Traveler/Guest)
const toggleHelpfulReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      res.status(404);
      return next(new Error('Review record not found'));
    }

    const userIdString = req.user.id.toString();
    const hasVoted = review.helpfulVotes.some(v => v.toString() === userIdString);

    if (hasVoted) {
      // Remove helpful vote
      review.helpfulVotes = review.helpfulVotes.filter(v => v.toString() !== userIdString);
    } else {
      // Add helpful vote
      review.helpfulVotes.push(req.user.id);
    }

    await review.save();

    res.status(200).json({
      success: true,
      helpfulVotesCount: review.helpfulVotes.length,
      hasVoted: !hasVoted
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  getListingReviews,
  toggleHelpfulReview
};
