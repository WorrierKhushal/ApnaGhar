const Booking = require('../models/Booking');
const Listing = require('../models/Listing');
const Experience = require('../models/Experience');

// Expiry Cleanup Logic: Expire unpaid pending_payment bookings after 10 minutes
const cleanupExpiredBookings = async () => {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  await Booking.updateMany(
    {
      status: 'pending_payment',
      createdAt: { $lt: tenMinutesAgo }
    },
    {
      status: 'cancelled'
    }
  );
};

// Helper function to check if stay dates are blocked/overlapping
const checkOverlappingDates = async (listingId, checkInDate, checkOutDate) => {
  await cleanupExpiredBookings();
  const overlappingBooking = await Booking.findOne({
    listing: listingId,
    status: { $in: ['pending', 'pending_payment', 'payment_submitted', 'confirmed'] },
    checkIn: { $lt: new Date(checkOutDate) },
    checkOut: { $gt: new Date(checkInDate) }
  });
  return !!overlappingBooking;
};

// @desc    Request a stay booking
// @route   POST /api/bookings
// @access  Private (Traveler/Guest)
const createBooking = async (req, res, next) => {
  try {
    const {
      listingId,
      checkIn,
      checkOut,
      guests,
      experiencesBooked
    } = req.body;

    // 1. Simple date validations
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      res.status(400);
      return next(new Error('Invalid check-in or check-out date parameters'));
    }

    if (checkInDate < today) {
      res.status(400);
      return next(new Error('Check-in date cannot be in the past'));
    }

    if (checkInDate >= checkOutDate) {
      res.status(400);
      return next(new Error('Check-out date must be after check-in date'));
    }

    // 2. Fetch Stay listing
    const listing = await Listing.findById(listingId);
    if (!listing) {
      res.status(404);
      return next(new Error('Stay listing not found'));
    }

    // 3. Guest Capacity safeguard
    if (Number(guests) > listing.maxGuests) {
      res.status(400);
      return next(new Error(`Stay capacity limit exceeded. Maximum guests allowed: ${listing.maxGuests}`));
    }

    // 4. Overlapping booking block safeguard
    const isOverlapping = await checkOverlappingDates(listingId, checkIn, checkOut);
    if (isOverlapping) {
      res.status(400);
      return next(new Error('The stay is already booked for these selected dates. Please select other dates.'));
    }

    // 5. Total pricing calculation
    const diffTime = Math.abs(checkOutDate - checkInDate);
    const nightsCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const stayCost = listing.pricePerNight * nightsCount;

    // Calculate native experiences cost
    let experienceCost = 0;
    const experiencesList = [];

    if (experiencesBooked && experiencesBooked.length > 0) {
      for (const item of experiencesBooked) {
        const exp = await Experience.findById(item.experienceId);
        if (exp) {
          const qty = Number(item.qty) || Number(guests);
          experienceCost += exp.price * qty;
          experiencesList.push({
            experience: exp._id,
            qty,
            price: exp.price
          });
        }
      }
    }

    const totalCost = stayCost + experienceCost;

    // 6. Create booking entry in DB
    const booking = await Booking.create({
      listing: listingId,
      user: req.user.id, // Traveler active user context
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests: Number(guests),
      totalPrice: totalCost,
      status: 'pending_payment', // Block dates for 10 minutes
      experiencesBooked: experiencesList,
      paymentDetails: {
        transactionId: `TXN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        status: 'unpaid'
      }
    });

    // Log booking interaction in DB
    const Interaction = require('../models/Interaction');
    await Interaction.findOneAndUpdate(
      { user: req.user.id, listing: listingId, interactionType: 'booking' },
      { user: req.user.id, listing: listingId, interactionType: 'booking', weight: 5.0, timestamp: new Date() },
      { upsert: true, new: true }
    );

    res.status(201).json({
      success: true,
      message: 'Booking requested successfully. Awaiting host confirmation.',
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get traveler's booking history
// @route   GET /api/bookings/user
// @access  Private (Traveler/Guest)
const getUserBookings = async (req, res, next) => {
  try {
    await cleanupExpiredBookings();
    const bookings = await Booking.find({ user: req.user.id })
      .populate({
        path: 'listing',
        select: 'title images location pricePerNight safetyIndicators'
      })
      .populate({
        path: 'experiencesBooked.experience',
        select: 'title type duration'
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get bookings for host's properties
// @route   GET /api/bookings/host
// @access  Private (Host or Admin only)
const getHostBookings = async (req, res, next) => {
  try {
    await cleanupExpiredBookings();
    // 1. Retrieve all stays owned by this host
    const hostListings = await Listing.find({ host: req.user.id });
    const listingIds = hostListings.map(l => l._id);

    // 2. Fetch bookings matching those stays
    const bookings = await Booking.find({ listing: { $in: listingIds } })
      .populate({
        path: 'listing',
        select: 'title images pricePerNight'
      })
      .populate({
        path: 'user',
        select: 'name email phoneNumber'
      })
      .populate({
        path: 'experiencesBooked.experience',
        select: 'title price'
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update booking reservation status (Confirm or Cancel)
// @route   PUT /api/bookings/:id/status
// @access  Private (Host or Admin)
const updateBookingStatus = async (req, res, next) => {
  try {
    await cleanupExpiredBookings();
    const { status } = req.body; // 'confirmed' or 'cancelled'
    
    if (!['confirmed', 'cancelled'].includes(status)) {
      res.status(400);
      return next(new Error('Invalid reservation status update target'));
    }

    const booking = await Booking.findById(req.params.id).populate('listing');
    if (!booking) {
      res.status(404);
      return next(new Error('Booking record not found'));
    }

    // Authorization safeguard check: verify requester owns stay
    if (booking.listing.host.toString() !== req.user.id && req.user.role !== 'admin') {
      res.status(403);
      return next(new Error('Not authorized to update status for this booking'));
    }

    // Date conflicts check before confirming booking
    if (status === 'confirmed') {
      const isOverlapping = await Booking.findOne({
        _id: { $ne: booking._id },
        listing: booking.listing._id,
        status: 'confirmed',
        checkIn: { $lt: booking.checkOut },
        checkOut: { $gt: booking.checkIn }
      });

      if (isOverlapping) {
        res.status(400);
        return next(new Error('Cannot confirm. Overlapping confirmed booking already exists for these dates.'));
      }

      booking.paymentDetails.status = 'paid'; // simulate paid status upon confirmation
    } else if (status === 'cancelled') {
      booking.paymentDetails.status = 'refunded';
    }

    booking.status = status;
    await booking.save();

    res.status(200).json({
      success: true,
      message: `Booking status successfully updated to ${status}`,
      data: booking
    });
  } catch (error) {
    next(error);
  }
};
// @desc    Submit payment UTR details for a booking (UTR-Only flow)
// @route   PUT /api/bookings/:id/submit-payment
// @access  Private (Traveler/Guest)
const submitPaymentReceipt = async (req, res, next) => {
  try {
    const { utrNumber } = req.body;
    if (!utrNumber) {
      res.status(400);
      return next(new Error('12-digit UTR Number is required'));
    }

    const utrStr = String(utrNumber).trim();
    if (!/^\d{12}$/.test(utrStr)) {
      res.status(400);
      return next(new Error('UTR Number must be exactly 12 numeric digits'));
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      res.status(404);
      return next(new Error('Booking not found'));
    }

    if (booking.user.toString() !== req.user.id) {
      res.status(403);
      return next(new Error('Not authorized to submit payment for this booking'));
    }

    booking.status = 'payment_submitted';
    booking.paymentDetails.utrNumber = utrStr;
    booking.paymentDetails.transactionId = utrStr;
    booking.paymentDetails.status = 'paid';

    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Payment UTR submitted successfully. Awaiting host verification.',
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get booking details by ID
// @route   GET /api/bookings/:id
// @access  Private
const getBookingById = async (req, res, next) => {
  try {
    await cleanupExpiredBookings();
    
    let booking = await Booking.findById(req.params.id)
      .populate({
        path: 'listing',
        select: 'title images location pricePerNight payoutDetails host'
      })
      .populate({
        path: 'user',
        select: 'name email phoneNumber'
      });

    if (!booking) {
      res.status(404);
      return next(new Error('Booking not found'));
    }

    // Check authorization: traveler, host, or admin
    const hostId = booking.listing?.host?.toString();
    const isUser = booking.user?._id?.toString() === req.user.id;
    const isHost = hostId === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isUser && !isHost && !isAdmin) {
      res.status(403);
      return next(new Error('Not authorized to view this booking'));
    }

    // Direct check for 10-minute expiry
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    if (booking.status === 'pending_payment' && booking.createdAt < tenMinutesAgo) {
      booking.status = 'cancelled';
      await booking.save();
    }

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get bookings (unified query for guest history vs host reservations)
// @route   GET /api/bookings
// @access  Private
const getBookings = async (req, res, next) => {
  try {
    await cleanupExpiredBookings();
    
    const { role } = req.query; // 'host' or 'guest'
    
    if (role === 'host') {
      const hostListings = await Listing.find({ host: req.user.id });
      const listingIds = hostListings.map(l => l._id);
      const bookings = await Booking.find({ listing: { $in: listingIds } })
        .populate({
          path: 'listing',
          select: 'title images pricePerNight'
        })
        .populate({
          path: 'user',
          select: 'name email phoneNumber'
        })
        .populate({
          path: 'experiencesBooked.experience',
          select: 'title price'
        })
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        count: bookings.length,
        data: bookings
      });
    } else {
      // Default: Guest History
      const bookings = await Booking.find({ user: req.user.id })
        .populate({
          path: 'listing',
          select: 'title images location pricePerNight safetyIndicators'
        })
        .populate({
          path: 'experiencesBooked.experience',
          select: 'title type duration'
        })
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        count: bookings.length,
        data: bookings
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getUserBookings,
  getHostBookings,
  getBookings,
  updateBookingStatus,
  submitPaymentReceipt,
  getBookingById
};
