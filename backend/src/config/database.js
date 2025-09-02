const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Create indexes for performance
    await createIndexes();
    
  } catch (error) {
    console.error('Database connection error:', error.message);
    process.exit(1);
  }
};

const createIndexes = async () => {
  try {
    const User = require('../models/User');
    const Shop = require('../models/Shop');

    // User indexes
    await User.collection.createIndex(
      { "username": 1 }, 
      { unique: true, collation: { locale: "en", strength: 2 } }
    );
    await User.collection.createIndex({ "shopId": 1 });
    await User.collection.createIndex({ "role": 1 });

    // Shop indexes
    await Shop.collection.createIndex({ "adminUsername": 1 });
    await Shop.collection.createIndex({ "isActive": 1 });
    await Shop.collection.createIndex({ "shopCode": 1 }, { unique: true });

    console.log('Database indexes created successfully');

  } catch (error) {
    console.log('Index creation note:', error.message);
    // Don't exit process for index errors, they might already exist
  }
};

module.exports = connectDB;