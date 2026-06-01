const Wishlist = require('../models/Wishlist');

// @desc    Toggle stay listing in personal wishlist (Save / Unsave)
// @route   POST /api/wishlists/toggle
// @access  Private (Traveler/Guest)
const toggleWishlist = async (req, res, next) => {
  try {
    const { listingId } = req.body;
    if (!listingId) {
      res.status(400);
      return next(new Error('Property Listing ID parameter is required'));
    }

    // Find wishlist for the active user context or create if none exists
    let wishlist = await Wishlist.findOne({ user: req.user.id });

    if (!wishlist) {
      wishlist = await Wishlist.create({
        user: req.user.id,
        listings: []
      });
    }

    const index = wishlist.listings.indexOf(listingId);
    let saved = false;

    const Interaction = require('../models/Interaction');

    if (index > -1) {
      // Remove stay if already wishlisted
      wishlist.listings.splice(index, 1);
      // Remove interaction from DB
      await Interaction.deleteOne({ user: req.user.id, listing: listingId, interactionType: 'wishlist' });
    } else {
      // Add stay if not wishlisted
      wishlist.listings.push(listingId);
      saved = true;
      // Log interaction in DB
      await Interaction.findOneAndUpdate(
        { user: req.user.id, listing: listingId, interactionType: 'wishlist' },
        { user: req.user.id, listing: listingId, interactionType: 'wishlist', weight: 3.0, timestamp: new Date() },
        { upsert: true, new: true }
      );
    }

    await wishlist.save();

    res.status(200).json({
      success: true,
      message: saved ? 'Stay saved to your wishlist' : 'Stay removed from your wishlist',
      saved
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Retrieve traveler wishlisted stays
// @route   GET /api/wishlists
// @access  Private (Traveler/Guest)
const getWishlist = async (req, res, next) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user.id }).populate({
      path: 'listings',
      select: 'title images pricePerNight location safetyIndicators demandIndicator'
    });

    res.status(200).json({
      success: true,
      data: wishlist ? wishlist.listings : []
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  toggleWishlist,
  getWishlist
};
