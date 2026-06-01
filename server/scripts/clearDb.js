const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');

// Models
const User = require('../models/User');
const Listing = require('../models/Listing');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Experience = require('../models/Experience');
const Wishlist = require('../models/Wishlist');

// Load environment variables
dotenv.config();

const clearDatabase = async () => {
  try {
    // 1. Connect to database
    await connectDB();
    
    console.log('Starting database purge to prepare for manual data entry...');

    // 2. Clear listings, reviews, bookings, wishlists, experiences
    console.log('Clearing stay listings...');
    await Listing.deleteMany({});
    
    console.log('Clearing bookings...');
    await Booking.deleteMany({});
    
    console.log('Clearing reviews...');
    await Review.deleteMany({});
    
    console.log('Clearing experiences...');
    await Experience.deleteMany({});
    
    console.log('Clearing wishlists...');
    await Wishlist.deleteMany({});

    // 3. Clear non-default users
    console.log('Removing non-default user registry items...');
    await User.deleteMany({ email: { $nin: ['seedhost@apnaghar.com', 'admin@apnaghar.com'] } });

    // Hash password for default users
    const hashedPassword = await bcrypt.hash('password123', 10);

    // 4. Ensure Khushal Dev default user exists
    console.log('Verifying default host account (Khushal Dev)...');
    let seedHost = await User.findOne({ email: 'seedhost@apnaghar.com' });
    if (!seedHost) {
      console.log('Re-creating default host user account...');
      seedHost = await User.create({
        name: 'Khushal Dev',
        email: 'seedhost@apnaghar.com',
        password: hashedPassword,
        role: 'host',
        isEmailVerified: true,
        profilePicture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        phoneNumber: '+91 98765 43210',
        hostDetails: {
          bio: 'Namaste! I am Khushal, an Indian history enthusiast and homestay operator. I love sharing Rajasthani culture, heritage tours, and local street cuisines.',
          languages: ['Hindi', 'English'],
          responseRate: 98,
          responseTime: 'Within 15 minutes',
          trustScore: 96,
          isVerifiedHost: true
        }
      });
      console.log('Default host account created successfully.');
    } else {
      // Ensure defaults are restored
      seedHost.name = 'Khushal Dev';
      seedHost.role = 'host';
      seedHost.profilePicture = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80';
      seedHost.phoneNumber = '+91 98765 43210';
      seedHost.isEmailVerified = true;
      seedHost.password = hashedPassword;
      await seedHost.save();
      console.log('Default host account reset to clean state.');
    }

    // 5. Ensure System Admin default user exists
    console.log('Verifying default admin account (System Admin)...');
    let adminUser = await User.findOne({ email: 'admin@apnaghar.com' });
    if (!adminUser) {
      console.log('Re-creating default admin user account...');
      await User.create({
        name: 'System Admin',
        email: 'admin@apnaghar.com',
        password: hashedPassword,
        role: 'admin',
        isEmailVerified: true,
        profilePicture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=facearea&facepad=2&w=100&h=100&q=80',
        phoneNumber: '+91 99999 99999'
      });
      console.log('Default admin account created successfully.');
    } else {
      adminUser.name = 'System Admin';
      adminUser.role = 'admin';
      adminUser.isEmailVerified = true;
      adminUser.password = hashedPassword;
      await adminUser.save();
      console.log('Default admin account reset to clean state.');
    }

    console.log('Database purge and clean defaults initialization completed! 🎉');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Purging database failed:', error);
    process.exit(1);
  }
};

clearDatabase();
