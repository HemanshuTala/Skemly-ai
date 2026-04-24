import mongoose from 'mongoose';
import logger from '../utils/logger';

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/skemly';
  try {
    await mongoose.connect(uri);
    logger.info('✅ MongoDB connected');
  } catch (err) {
    logger.error('MongoDB connection error:', err);
    throw err;
  }
}
