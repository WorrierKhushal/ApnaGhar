const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Name is required'], 
    trim: true 
  },
  email: { 
    type: String, 
    required: [true, 'Email is required'], 
    unique: true, 
    lowercase: true,
    trim: true
  },
  password: { 
    type: String, 
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters']
  },
  role: { 
    type: String, 
    enum: ['user', 'host', 'admin'], 
    default: 'user' 
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  isEmailVerified: { 
    type: Boolean, 
    default: false 
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  refreshToken: String,
  profilePicture: {
    type: String,
    default: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=facearea&facepad=2&w=100&h=100&q=80'
  },
  hostDetails: {
    bio: { type: String, trim: true },
    languages: [{ type: String }],
    responseRate: { type: Number, default: 100 }, // in percentage
    responseTime: { type: String, default: 'Within 1 hour' },
    trustScore: { type: Number, min: 0, max: 100, default: 80 }, // custom algorithm score
    isVerifiedHost: { type: Boolean, default: false }
  }
}, { 
  timestamps: true 
});

// Indexes for fast authentication filtering
userSchema.index({ email: 1 });

module.exports = mongoose.model('User', userSchema);
