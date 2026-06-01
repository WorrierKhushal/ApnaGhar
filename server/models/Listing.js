const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: [true, 'Stay title is required'], 
    trim: true,
    maxlength: [120, 'Title cannot exceed 120 characters']
  },
  description: { 
    type: String, 
    required: [true, 'Description is required'] 
  },
  images: {
    type: [String],
    validate: [array => array.length >= 3, 'Stay must have at least 3 high-quality images']
  },
  pricePerNight: { 
    type: Number, 
    required: [true, 'Price per night is required'],
    min: [0, 'Price cannot be negative']
  },
  location: {
    state: { type: String, required: true },
    city: { type: String, required: true, index: true },
    address: { type: String, required: true },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    }
  },
  amenities: [{ type: String }],
  maxGuests: { type: Number, required: true, default: 1 },
  bedrooms: { type: Number, required: true, default: 1 },
  bathrooms: { type: Number, required: true, default: 1 },
  houseRules: [{ type: String }],
  host: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  
  // Custom Indian Travel Filters
  indianFilters: {
    nearRailway: { type: Boolean, default: false },
    nearMetro: { type: Boolean, default: false },
    nearAirport: { type: Boolean, default: false },
    nearTemple: { type: Boolean, default: false },
    nearTouristPlace: { type: Boolean, default: false },
    vegFoodNearby: { type: Boolean, default: false },
    jainFoodNearby: { type: Boolean, default: false }
  },

  // Premium Safety Index Indicators
  safetyIndicators: {
    safetyIndex: { type: Number, min: 0, max: 10, default: 8.5 },
    familySafe: { type: Boolean, default: false },
    soloSafe: { type: Boolean, default: false },
    womenFriendly: { type: Boolean, default: false }
  },

  // Host Onboarding Payout Details
  payoutDetails: {
    upiId: { type: String, default: '' },
    bankDetails: {
      accountHolder: { type: String, default: '' },
      bankAccount: { type: String, default: '' },
      ifscCode: { type: String, default: '' }
    },
    qrCodeUrl: { type: String, default: '' }
  },

  // Dynamic Demand and Booking parameters
  demandIndicator: { 
    type: String, 
    enum: ['Low', 'Medium', 'High'], 
    default: 'Medium' 
  },
  bestTimeToBook: { 
    type: String, 
    default: 'October - March' 
  }
}, { 
  timestamps: true 
});

// Compound index for location searches and price sorting
listingSchema.index({ 'location.city': 1, pricePerNight: 1 });
listingSchema.index({ 'location.state': 1 });

module.exports = mongoose.model('Listing', listingSchema);
