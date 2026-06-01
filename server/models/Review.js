const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  listing: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Listing', 
    required: true,
    index: true 
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: [true, 'Review must be linked to a verified booking']
  },
  ratings: {
    cleanliness: { type: Number, required: true, min: 1, max: 5 },
    communication: { type: Number, required: true, min: 1, max: 5 },
    location: { type: Number, required: true, min: 1, max: 5 },
    value: { type: Number, required: true, min: 1, max: 5 },
    localVibe: { type: Number, required: true, min: 1, max: 5 } // Local vibe rating
  },
  overallRating: { 
    type: Number, 
    default: 5 
  },
  comment: { 
    type: String, 
    required: [true, 'Review comment is required'],
    trim: true,
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  helpfulVotes: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  isVerified: { 
    type: Boolean, 
    default: true 
  }
}, { 
  timestamps: true 
});

// Middleware to calculate overall average rating before save
reviewSchema.pre('save', function(next) {
  const r = this.ratings;
  this.overallRating = (r.cleanliness + r.communication + r.location + r.value + r.localVibe) / 5;
  next();
});

module.exports = mongoose.model('Review', reviewSchema);
