const mongoose = require('mongoose');

const interactionSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    index: true 
  },
  listing: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Listing', 
    required: true, 
    index: true 
  },
  interactionType: { 
    type: String, 
    enum: ['view', 'wishlist', 'booking', 'review'], 
    required: true 
  },
  weight: { 
    type: Number, 
    required: true 
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Compound index to quickly fetch user interaction rows
interactionSchema.index({ user: 1, listing: 1, interactionType: 1 });

module.exports = mongoose.model('Interaction', interactionSchema);
