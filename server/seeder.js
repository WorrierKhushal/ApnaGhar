const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');
const Listing = require('./models/Listing');
const Experience = require('./models/Experience');
const Booking = require('./models/Booking');
const Review = require('./models/Review');
const Wishlist = require('./models/Wishlist');
const Interaction = require('./models/Interaction');
const SearchHistory = require('./models/SearchHistory');

dotenv.config();

const seedData = async () => {
  try {
    // 1. Connect to database
    await connectDB();

    // Hash passwords before user creation
    const hashedPassword = await bcrypt.hash('password123', 10);

    // 2. Clear existing collections
    console.log('Clearing existing collections...');
    await Listing.deleteMany({});
    await Experience.deleteMany({});
    await User.deleteMany({});
    await Booking.deleteMany({});
    await Review.deleteMany({});
    await Wishlist.deleteMany({});
    await Interaction.deleteMany({});
    await SearchHistory.deleteMany({});

    // 3. Create Host & Admin users
    console.log('Creating host and admin users...');
    const seedHost = await User.create({
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

    const seedAdmin = await User.create({
      name: 'System Admin',
      email: 'admin@apnaghar.com',
      password: hashedPassword,
      role: 'admin',
      isEmailVerified: true,
      profilePicture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=facearea&facepad=2&w=100&h=100&q=80',
      phoneNumber: '+91 99999 99999'
    });

    // Create traveler users
    console.log('Creating traveler users...');
    const userAarav = await User.create({
      name: 'Aarav Sharma',
      email: 'aarav@apnaghar.com',
      password: hashedPassword,
      role: 'user',
      isEmailVerified: true,
      profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
    });

    const userPriya = await User.create({
      name: 'Priya Patel',
      email: 'priya@apnaghar.com',
      password: hashedPassword,
      role: 'user',
      isEmailVerified: true,
      profilePicture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80'
    });

    const userVikram = await User.create({
      name: 'Vikram Singh',
      email: 'vikram@apnaghar.com',
      password: hashedPassword,
      role: 'user',
      isEmailVerified: true,
      profilePicture: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80'
    });

    const userAnanya = await User.create({
      name: 'Ananya Rao',
      email: 'ananya@apnaghar.com',
      password: hashedPassword,
      role: 'user',
      isEmailVerified: true,
      profilePicture: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80'
    });

    const hostId = seedHost._id;

    // 4. Create Listings (Stays)
    console.log('Seeding properties staying data...');
    const listings = await Listing.insertMany([
      {
        title: '150-Year-Old Royal Heritage Haveli',
        description: 'Welcome to a piece of Rajasthan\'s royal history. Lovingly preserved across generations, our family Haveli features exquisite hand-painted frescoes, a peaceful central courtyard (chowk), and home-cooked traditional meals. Our stay provides an authentic immersion into old-town heritage while offering modern comfort.',
        images: [
          'https://images.unsplash.com/photo-1585983224974-084a8e065e76?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1598977123418-45f04b615e0e?auto=format&fit=crop&w=400&q=80',
          'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=400&q=80'
        ],
        pricePerNight: 4500,
        location: {
          state: 'Rajasthan',
          city: 'Jaipur',
          address: '32, Johri Bazar Road, Old City',
          coordinates: { lat: 26.9124, lng: 75.7873 }
        },
        amenities: ['Free High-speed Wi-Fi', 'Pure Veg Meals Available', 'Air Conditioning', 'Hot Water Geyser', 'Power Backup'],
        maxGuests: 4,
        bedrooms: 2,
        bathrooms: 2,
        houseRules: ['No smoking indoors', 'Vegetarian food only inside the premises', 'Silence after 10 PM'],
        host: hostId,
        indianFilters: {
          nearRailway: true,
          nearMetro: true,
          nearAirport: false,
          nearTemple: true,
          nearTouristPlace: true,
          vegFoodNearby: true,
          jainFoodNearby: true
        },
        safetyIndicators: {
          safetyIndex: 9.8,
          familySafe: true,
          soloSafe: true,
          womenFriendly: true
        },
        demandIndicator: 'High',
        bestTimeToBook: 'October - March'
      },
      {
        title: 'Luxury Pine Wood Treehouse overlooking Himalayas',
        description: 'Perched high in the cedar trees of Manali, our premium handcrafted wooden cabin offers panoramic views of snow-capped mountains. Wake up to fresh mountain air, enjoy organic apple orchard breakfast, and hike around native pine forest trails.',
        images: [
          'https://images.unsplash.com/photo-1508193638397-1c4234db14d8?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=400&q=80',
          'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=400&q=80'
        ],
        pricePerNight: 6200,
        location: {
          state: 'Himachal Pradesh',
          city: 'Manali',
          address: 'Old Manali, Hill Road Cabin 5',
          coordinates: { lat: 32.2396, lng: 77.1887 }
        },
        amenities: ['Fireplace Heating', 'High-speed Wi-Fi', 'Kitchenette', 'Private Balcony', 'Outdoor Bonfire Pit'],
        maxGuests: 2,
        bedrooms: 1,
        bathrooms: 1,
        houseRules: ['Respect the nature', 'Carry all plastic trash back', 'Warm clothing recommended'],
        host: hostId,
        indianFilters: {
          nearRailway: false,
          nearMetro: false,
          nearAirport: false,
          nearTemple: true,
          nearTouristPlace: true,
          vegFoodNearby: true,
          jainFoodNearby: false
        },
        safetyIndicators: {
          safetyIndex: 9.5,
          familySafe: true,
          soloSafe: true,
          womenFriendly: true
        },
        demandIndicator: 'Medium',
        bestTimeToBook: 'April - June'
      },
      {
        title: 'Traditional Kettuvallam Houseboat on Alleppey Backwaters',
        description: 'Cruise along the scenic Kerala backwaters in a traditional premium houseboat made entirely of coir, wood, and bamboo. Feast on local karimeen fish, witness paddy fields, and rest comfortably in fully air-conditioned bedroom suites.',
        images: [
          'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=400&q=80',
          'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=400&q=80'
        ],
        pricePerNight: 8500,
        location: {
          state: 'Kerala',
          city: 'Alleppey',
          address: 'Finishing Point Jetty, Backwaters Resort Area',
          coordinates: { lat: 9.4981, lng: 76.3388 }
        },
        amenities: ['Fully Staffed Boat', 'Fresh Kerala Meals Included', 'Air Conditioned Rooms', 'Flat TV Screen', 'Sundeck Lounger'],
        maxGuests: 6,
        bedrooms: 3,
        bathrooms: 3,
        houseRules: ['Check-in at 12 PM, Cruise stops at 5:30 PM due to local fishing nets regulations', 'No swimming in deep canals without safety vests'],
        host: hostId,
        indianFilters: {
          nearRailway: true,
          nearMetro: false,
          nearAirport: false,
          nearTemple: false,
          nearTouristPlace: true,
          vegFoodNearby: false,
          jainFoodNearby: false
        },
        safetyIndicators: {
          safetyIndex: 9.9,
          familySafe: true,
          soloSafe: false,
          womenFriendly: true
        },
        demandIndicator: 'High',
        bestTimeToBook: 'November - February'
      }
    ]);

    console.log('Seeded properties count:', listings.length);

    // 5. Create Experiences
    console.log('Seeding local experiences...');
    const experiences = await Experience.insertMany([
      {
        host: hostId,
        listing: listings[0]._id, // link to Jaipur Haveli
        title: 'Traditional Blue Clay Pottery Masterclass',
        description: 'Learn the age-old art of Jaipur Blue Pottery from master craftsmen. Sculpt your own floral trinket dish, paint with natural cobalt dyes, and learn the historical roots of clay glaze.',
        images: ['https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=400&q=80'],
        price: 750,
        type: 'culture',
        location: { city: 'Jaipur', state: 'Rajasthan' },
        duration: '3 hours'
      },
      {
        host: hostId,
        listing: listings[0]._id, // link to Jaipur Haveli
        title: 'Old City Heritage Food & Spice Tour',
        description: 'Eat your way through Jaipur\'s oldest lanes. Taste hot pyaaz kachoris, custom rose lassis, pure ghee sweets, and visit private heritage spice mills active since the 1800s.',
        images: ['https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=400&q=80'],
        price: 1200,
        type: 'food',
        location: { city: 'Jaipur', state: 'Rajasthan' },
        duration: '4 hours'
      },
      {
        host: hostId,
        listing: listings[1]._id, // link to Manali Stay
        title: 'Parvati Valley Alpine Forest Trek',
        description: 'A guided hike through dense pine trails, passing small Himalayan streams, waterfall view decks, and stopping for hot organic herbal tea in a remote wood hamlet.',
        images: ['https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80'],
        price: 1500,
        type: 'adventure',
        location: { city: 'Manali', state: 'Himachal Pradesh' },
        duration: '6 hours'
      }
    ]);

    console.log('Seeded experiences count:', experiences.length);

    // 6. Create Bookings & Reviews for realistic data
    console.log('Seeding bookings and reviews...');
    
    // Priya booked and reviewed Manali
    const bookingPriya = await Booking.create({
      listing: listings[1]._id,
      user: userPriya._id,
      checkIn: new Date('2026-05-10'),
      checkOut: new Date('2026-05-15'),
      guests: 2,
      totalPrice: 31000,
      status: 'completed',
      paymentDetails: {
        transactionId: 'TXN100002',
        utrNumber: '999900008888',
        status: 'paid'
      }
    });

    const reviewPriya = await Review.create({
      listing: listings[1]._id,
      user: userPriya._id,
      booking: bookingPriya._id,
      ratings: {
        cleanliness: 5,
        communication: 5,
        location: 5,
        value: 5,
        localVibe: 5
      },
      comment: 'Absolutely magical stay in the Himalayas. The wood cabins were warm and the view is breathtaking!'
    });

    // Vikram booked and reviewed Houseboat
    const bookingVikram = await Booking.create({
      listing: listings[2]._id,
      user: userVikram._id,
      checkIn: new Date('2026-05-18'),
      checkOut: new Date('2026-05-20'),
      guests: 4,
      totalPrice: 17000,
      status: 'completed',
      paymentDetails: {
        transactionId: 'TXN100003',
        utrNumber: '999900007777',
        status: 'paid'
      }
    });

    const reviewVikram = await Review.create({
      listing: listings[2]._id,
      user: userVikram._id,
      booking: bookingVikram._id,
      ratings: {
        cleanliness: 5,
        communication: 5,
        location: 5,
        value: 5,
        localVibe: 5
      },
      comment: 'Unforgettable houseboat cruise on Alleppey backwaters. Fresh food and lovely staff.'
    });

    // Ananya booked Houseboat
    const bookingAnanya = await Booking.create({
      listing: listings[2]._id,
      user: userAnanya._id,
      checkIn: new Date('2026-06-15'),
      checkOut: new Date('2026-06-18'),
      guests: 2,
      totalPrice: 25500,
      status: 'confirmed',
      paymentDetails: {
        transactionId: 'TXN100004',
        utrNumber: '999900006666',
        status: 'paid'
      }
    });

    // 7. Seed User Interaction Utility Matrix Logs
    console.log('Seeding user interactions logs...');
    
    // User 1: Aarav Sharma -> Haveli (View, Wishlist), Treehouse (View)
    await Interaction.insertMany([
      { user: userAarav._id, listing: listings[0]._id, interactionType: 'view', weight: 1.0 },
      { user: userAarav._id, listing: listings[0]._id, interactionType: 'wishlist', weight: 3.0 },
      { user: userAarav._id, listing: listings[1]._id, interactionType: 'view', weight: 1.0 }
    ]);

    // User 2: Priya Patel -> Treehouse (View, Booking, Review), Haveli (View)
    await Interaction.insertMany([
      { user: userPriya._id, listing: listings[1]._id, interactionType: 'view', weight: 1.0 },
      { user: userPriya._id, listing: listings[1]._id, interactionType: 'booking', weight: 5.0 },
      { user: userPriya._id, listing: listings[1]._id, interactionType: 'review', weight: 4.0 }, // 4.0 * (5/5)
      { user: userPriya._id, listing: listings[0]._id, interactionType: 'view', weight: 1.0 }
    ]);

    // User 3: Vikram Singh -> Houseboat (View, Booking, Review), Treehouse (View, Wishlist)
    await Interaction.insertMany([
      { user: userVikram._id, listing: listings[2]._id, interactionType: 'view', weight: 1.0 },
      { user: userVikram._id, listing: listings[2]._id, interactionType: 'booking', weight: 5.0 },
      { user: userVikram._id, listing: listings[2]._id, interactionType: 'review', weight: 4.0 },
      { user: userVikram._id, listing: listings[1]._id, interactionType: 'view', weight: 1.0 },
      { user: userVikram._id, listing: listings[1]._id, interactionType: 'wishlist', weight: 3.0 }
    ]);

    // User 4: Ananya Rao -> Haveli (View), Houseboat (View, Booking)
    await Interaction.insertMany([
      { user: userAnanya._id, listing: listings[0]._id, interactionType: 'view', weight: 1.0 },
      { user: userAnanya._id, listing: listings[2]._id, interactionType: 'view', weight: 1.0 },
      { user: userAnanya._id, listing: listings[2]._id, interactionType: 'booking', weight: 5.0 }
    ]);

    // 8. Seed Search History
    console.log('Seeding search histories...');
    await SearchHistory.insertMany([
      { user: userAarav._id, query: 'Jaipur heritage stays' },
      { user: userPriya._id, query: 'Manali treehouse' },
      { user: userVikram._id, query: 'Alleppey houseboat' },
      { user: userAnanya._id, query: 'Kerala backwaters' }
    ]);

    console.log('Database fully seeded with ML recommendation engine ready datasets! 🎉');
    
    // Close DB connection
    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('Seeding process failed:', error);
    process.exit(1);
  }
};

seedData();
