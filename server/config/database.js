import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    
    if (!mongoUri) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('MONGO_URI environment variable must be set in production');
      }
      console.warn('[MongoDB] MONGO_URI not found. Database features will not work.');
      console.warn('[MongoDB] Set MONGO_URI to enable database functionality.');
      return null;
    }

    const conn = await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      dbName: 'Wellbeing',
    });

    console.log(`[MongoDB] Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('[MongoDB] Connection error:', error.message);
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
    return null;
  }
};

export default connectDB;
