const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  listing: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Listing', 
    required: true,
    index: true
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  checkIn: { 
    type: Date, 
    required: [true, 'Check-in date is required'] 
  },
  checkOut: { 
    type: Date, 
    required: [true, 'Check-out date is required'] 
  },
  guests: { 
    type: Number, 
    required: [true, 'Number of guests is required'],
    min: [1, 'Must have at least 1 guest']
  },
  totalPrice: { 
    type: Number, 
    required: [true, 'Total price is required'],
    min: [0, 'Total price cannot be negative']
  },
  status: { 
    type: String, 
    enum: ['pending', 'pending_payment', 'payment_submitted', 'confirmed', 'cancelled', 'completed'], 
    default: 'pending_payment' 
  },
  experiencesBooked: [{
    experience: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Experience'
    },
    qty: { type: Number, default: 1 },
    price: { type: Number, required: true }
  }],
  paymentDetails: {
    transactionId: String,
    utrNumber: String,
    status: {
      type: String,
      enum: ['unpaid', 'paid', 'refunded'],
      default: 'unpaid'
    }
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Booking', bookingSchema);
