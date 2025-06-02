const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000, // Increase timeout to 10s
      socketTimeoutMS: 45000,
      family: 4,
      retryWrites: true,
      connectTimeoutMS: 10000,
      w: 'majority'
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`💥 MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;