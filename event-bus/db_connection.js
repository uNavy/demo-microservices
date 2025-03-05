const mongoose = require('mongoose');

const MONGODB_URI='mongodb+srv://wayansup99:GUnIp1Lkm3IOOYiD@cluster0.41sj1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
    });

    console.log('📡 MongoDB Connected Successfully');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1); // Exit the process if the connection fails
  }
};

module.exports = connectDB;
