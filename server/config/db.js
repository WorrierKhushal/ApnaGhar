const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/apnaghar', {
      serverSelectionTimeoutMS: 5000 // Timeout after 5s instead of 30s
    });

    console.log(`MongoDB Atlas Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    // Graceful error exit in production or retry
    process.exit(1);
  }
};

module.exports = connectDB;
