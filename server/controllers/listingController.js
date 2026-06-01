const Listing = require('../models/Listing');
const jwt = require('jsonwebtoken');

// @desc    Get all listings / Search stays
// @route   GET /api/listings
// @access  Public
const getListings = async (req, res, next) => {
  try {
    const {
      search,
      city,
      state,
      minPrice,
      maxPrice,
      maxGuests,
      bedrooms,
      bathrooms,
      nearRailway,
      nearMetro,
      nearAirport,
      nearTemple,
      nearTouristPlace,
      vegFoodNearby,
      jainFoodNearby,
      familySafe,
      soloSafe,
      womenFriendly,
      propertyTypes,
      wifi,
      ac,
      sort,
      page = 1,
      limit = 12
    } = req.query;

    const query = {};

    // 1. Text Search matching title, state, city, address or description
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { 'location.city': searchRegex },
        { 'location.state': searchRegex },
        { 'location.address': searchRegex }
      ];

      // Log search history if user is authenticated
      if (req.user && req.user.id) {
        const SearchHistory = require('../models/SearchHistory');
        await SearchHistory.create({
          user: req.user.id,
          query: search
        });
      }
    }

    // 2. Direct city / state filtering
    if (city) {
      query['location.city'] = new RegExp(city, 'i');
    }
    if (state) {
      query['location.state'] = new RegExp(state, 'i');
    }

    // 3. Pricing limits
    if (minPrice || maxPrice) {
      query.pricePerNight = {};
      if (minPrice) query.pricePerNight.$gte = Number(minPrice);
      if (maxPrice) query.pricePerNight.$lte = Number(maxPrice);
    }

    // 4. Stay configurations
    if (maxGuests) {
      query.maxGuests = { $gte: Number(maxGuests) };
    }
    if (bedrooms) {
      query.bedrooms = { $gte: Number(bedrooms) };
    }
    if (bathrooms) {
      query.bathrooms = { $gte: Number(bathrooms) };
    }

    // 5. Custom Indian Travel Filters & Safety Enhancements
    // Using $and to combine advanced fallback keyword searches
    const filterClauses = [];

    if (nearRailway === 'true') {
      filterClauses.push({
        $or: [
          { 'indianFilters.nearRailway': true },
          { description: /railway|station|junction|transit/i }
        ]
      });
    }
    if (nearMetro === 'true') {
      filterClauses.push({
        $or: [
          { 'indianFilters.nearMetro': true },
          { description: /metro|subway|underground/i }
        ]
      });
    }
    if (nearAirport === 'true') {
      filterClauses.push({
        $or: [
          { 'indianFilters.nearAirport': true },
          { description: /airport|terminal|flight/i }
        ]
      });
    }
    if (nearTemple === 'true') {
      filterClauses.push({
        $or: [
          { 'indianFilters.nearTemple': true },
          { description: /temple|mandir|spiritual|ghat|ashram/i },
          { title: /temple|mandir|spiritual|ghat|ashram/i }
        ]
      });
    }
    if (nearTouristPlace === 'true') {
      filterClauses.push({
        $or: [
          { 'indianFilters.nearTouristPlace': true },
          { description: /tourist|sightseeing|monument|fort|palace/i }
        ]
      });
    }
    if (vegFoodNearby === 'true') {
      filterClauses.push({
        $or: [
          { 'indianFilters.vegFoodNearby': true },
          { description: /veg|vegetarian|sattvik|pure-veg|dhaba/i },
          { amenities: /veg|vegetarian|pure-veg/i }
        ]
      });
    }
    if (jainFoodNearby === 'true') {
      filterClauses.push({
        $or: [
          { 'indianFilters.jainFoodNearby': true },
          { description: /jain/i }
        ]
      });
    }

    if (propertyTypes) {
      const types = propertyTypes.split(',');
      const typeClauses = [];
      types.forEach(t => {
        if (t === 'Heritage Haveli') {
          typeClauses.push({ title: /haveli|palace|royal|fort/i }, { description: /haveli|palace|royal|fort/i });
        } else if (t === 'Ancestral Homestay') {
          typeClauses.push({ title: /homestay|ancestral|heritage|local/i }, { description: /homestay|ancestral|heritage|local/i });
        } else if (t === 'Farm Stay') {
          typeClauses.push({ title: /farm|estate|orchard|cottage/i }, { description: /farm|estate|orchard|cottage/i });
        } else if (t === 'Modern Villa') {
          typeClauses.push({ title: /villa|modern|apartment|flat/i }, { description: /villa|modern|apartment|flat/i });
        }
      });
      if (typeClauses.length > 0) {
        filterClauses.push({ $or: typeClauses });
      }
    }

    if (wifi === 'true') {
      filterClauses.push({ amenities: /wifi|wi-fi/i });
    }
    if (ac === 'true') {
      filterClauses.push({ amenities: /ac|air conditioning|air-conditioning/i });
    }

    // 6. Premium Safety Index Filters
    if (familySafe === 'true') query['safetyIndicators.familySafe'] = true;
    if (soloSafe === 'true') query['safetyIndicators.soloSafe'] = true;
    if (womenFriendly === 'true') {
      filterClauses.push({
        $or: [
          { 'safetyIndicators.womenFriendly': true, 'safetyIndicators.safetyIndex': { $gte: 9.0 } },
          { description: /women-friendly|female-friendly|cctv|safe neighbourhood|secure/i }
        ]
      });
    }

    if (filterClauses.length > 0) {
      query.$and = filterClauses;
    }

    // Execute query with pagination and sorting
    const skip = (Number(page) - 1) * Number(limit);
    let queryExec = Listing.find(query).populate('host', 'name profilePicture hostDetails');

    // Sorting options: 'price_asc', 'price_desc', 'rating_desc', 'newest'
    if (sort === 'price_asc') {
      queryExec = queryExec.sort({ pricePerNight: 1 });
    } else if (sort === 'price_desc') {
      queryExec = queryExec.sort({ pricePerNight: -1 });
    } else if (sort === 'rating_desc') {
      queryExec = queryExec.sort({ 'safetyIndicators.safetyIndex': -1 });
    } else {
      queryExec = queryExec.sort({ createdAt: -1 }); // default: newest
    }

    let listings = await queryExec.skip(skip).limit(Number(limit));
    const total = await Listing.countDocuments(query);

    // Boost Newly Created Listing: If current host is logged in, place their most recent stay at the top of search results (on page 1)
    let loggedInUserId = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        loggedInUserId = decoded.id;
      } catch (err) {
        // public endpoint, ignore token parsing errors
      }
    }

    if (loggedInUserId && Number(page) === 1) {
      // Find the user's most recently created stay that matches query filters
      const hostRecentQuery = { ...query, host: loggedInUserId };
      const hostRecent = await Listing.findOne(hostRecentQuery)
        .sort({ createdAt: -1 })
        .populate('host', 'name profilePicture hostDetails');

      if (hostRecent) {
        // Exclude the duplicate from the list if present
        listings = listings.filter(item => item._id.toString() !== hostRecent._id.toString());
        // Prepend it to the top
        listings.unshift(hostRecent);
        // Guarantee page limit length
        if (listings.length > Number(limit)) {
          listings.pop();
        }
      }
    }

    res.status(200).json({
      success: true,
      count: listings.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      data: listings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single listing details
// @route   GET /api/listings/:id
// @access  Public
const getListingById = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id).populate('host', 'name profilePicture hostDetails');
    if (!listing) {
      res.status(404);
      return next(new Error('Stay listing not found'));
    }

    // Log view interaction if user is authenticated
    if (req.user && req.user.id) {
      const Interaction = require('../models/Interaction');
      await Interaction.findOneAndUpdate(
        { user: req.user.id, listing: listing._id, interactionType: 'view' },
        { user: req.user.id, listing: listing._id, interactionType: 'view', weight: 1.0, timestamp: new Date() },
        { upsert: true, new: true }
      );
    }

    // Dynamic demand indicators (simulated based on stay popularity/views)
    const demandOptions = ['Low', 'Medium', 'High'];
    const randomDemand = demandOptions[Math.floor(Math.random() * demandOptions.length)];
    if (!listing.demandIndicator) {
      listing.demandIndicator = randomDemand;
    }

    res.status(200).json({
      success: true,
      data: listing
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a stay listing
// @route   POST /api/listings
// @access  Private (Host or Admin only)
const createListing = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401);
      return next(new Error('User not authenticated. Please log in.'));
    }

    const {
      title,
      description,
      images,
      pricePerNight,
      location,
      amenities,
      maxGuests,
      bedrooms,
      bathrooms,
      houseRules,
      indianFilters,
      safetyIndicators,
      bestTimeToBook,
      proximityTags,
      payoutDetails
    } = req.body;

    let parsedIndianFilters = indianFilters;
    if (typeof indianFilters === 'string') {
      try {
        parsedIndianFilters = JSON.parse(indianFilters);
      } catch (e) {
        console.error('Failed to parse indianFilters string:', e);
      }
    }

    let parsedPayoutDetails = payoutDetails;
    if (typeof payoutDetails === 'string') {
      try {
        parsedPayoutDetails = JSON.parse(payoutDetails);
      } catch (e) {
        console.error('Failed to parse payoutDetails string:', e);
      }
    }

    let parsedLocation = location;
    if (typeof location === 'string') {
      try {
        parsedLocation = JSON.parse(location);
      } catch (e) {
        console.error('Failed to parse location string:', e);
      }
    }

    let parsedSafetyIndicators = safetyIndicators;
    if (typeof safetyIndicators === 'string') {
      try {
        parsedSafetyIndicators = JSON.parse(safetyIndicators);
      } catch (e) {
        console.error('Failed to parse safetyIndicators string:', e);
      }
    }

    let finalIndianFilters = parsedIndianFilters || {};
    if (proximityTags && Array.isArray(proximityTags)) {
      finalIndianFilters = {
        nearRailway: proximityTags.some(t => typeof t === 'string' && t.toLowerCase().includes('railway')),
        nearMetro: proximityTags.some(t => typeof t === 'string' && t.toLowerCase().includes('metro')),
        nearAirport: proximityTags.some(t => typeof t === 'string' && t.toLowerCase().includes('airport')),
        nearTemple: proximityTags.some(t => typeof t === 'string' && t.toLowerCase().includes('temple')),
        nearTouristPlace: proximityTags.some(t => typeof t === 'string' && t.toLowerCase().includes('tourist')),
        vegFoodNearby: proximityTags.some(t => typeof t === 'string' && /veg|kitchen|cook/.test(t.toLowerCase())),
        jainFoodNearby: proximityTags.some(t => typeof t === 'string' && t.toLowerCase().includes('jain'))
      };
    }

    const newListing = await Listing.create({
      title,
      description,
      images,
      pricePerNight,
      location: parsedLocation,
      amenities,
      maxGuests,
      bedrooms,
      bathrooms,
      houseRules,
      host: req.user.id, // linked to current active user context
      indianFilters: finalIndianFilters,
      safetyIndicators: parsedSafetyIndicators,
      bestTimeToBook,
      payoutDetails: parsedPayoutDetails
    });


    res.status(201).json({
      success: true,
      message: 'Stay listing created successfully',
      data: newListing
    });
  } catch (error) {
    console.error('CRITICAL BACKEND ERROR IN createListing CONTROLLER:', error);
    next(error);
  }
};

// @desc    Update a stay listing
// @route   PUT /api/listings/:id
// @access  Private (Host / Owner or Admin only)
const updateListing = async (req, res, next) => {
  try {
    let listing = await Listing.findById(req.params.id);

    if (!listing) {
      res.status(404);
      return next(new Error('Stay listing not found'));
    }

    // Authorization safeguard check: verify requester owns stay
    if (listing.host.toString() !== req.user.id && req.user.role !== 'admin') {
      res.status(403);
      return next(new Error('Not authorized to edit this stay listing'));
    }

    const updateData = { ...req.body };
    if (req.body.proximityTags && Array.isArray(req.body.proximityTags)) {
      updateData.indianFilters = {
        nearRailway: req.body.proximityTags.some(t => t.toLowerCase().includes('railway')),
        nearMetro: req.body.proximityTags.some(t => t.toLowerCase().includes('metro')),
        nearAirport: req.body.proximityTags.some(t => t.toLowerCase().includes('airport')),
        nearTemple: req.body.proximityTags.some(t => t.toLowerCase().includes('temple')),
        nearTouristPlace: req.body.proximityTags.some(t => t.toLowerCase().includes('tourist')),
        vegFoodNearby: req.body.proximityTags.some(t => /veg|kitchen|cook/.test(t.toLowerCase())),
        jainFoodNearby: req.body.proximityTags.some(t => t.toLowerCase().includes('jain'))
      };
    }

    listing = await Listing.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Stay listing updated successfully',
      data: listing
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete stay listing
// @route   DELETE /api/listings/:id
// @access  Private (Host / Owner or Admin only)
const deleteListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      res.status(404);
      return next(new Error('Stay listing not found'));
    }

    // Authorization safeguard check: verify requester owns stay
    if (listing.host.toString() !== req.user.id && req.user.role !== 'admin') {
      res.status(403);
      return next(new Error('Not authorized to delete this stay listing'));
    }

    await listing.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Stay listing removed successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getListings,
  getListingById,
  createListing,
  updateListing,
  deleteListing
};
