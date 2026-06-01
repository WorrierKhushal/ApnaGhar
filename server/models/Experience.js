const mongoose = require('mongoose');

const experienceSchema = new mongoose.Schema({
  host: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  listing: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Listing' // optional link to a stay
  },
  title: { 
    type: String, 
    required: [true, 'Experience title is required'], 
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: { 
    type: String, 
    required: [true, 'Description is required'] 
  },
  images: [{ type: String }],
  price: { 
    type: Number, 
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  type: { 
    type: String, 
    enum: ['food', 'culture', 'village', 'adventure', 'rentals'], 
    required: true 
  },
  location: {
    city: { type: String, required: true },
    state: { type: String, required: true }
  },
  duration: { 
    type: String, 
    required: true,
    default: '2 hours' // e.g. "3 hours", "Full Day"
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Experience', experienceSchema);
