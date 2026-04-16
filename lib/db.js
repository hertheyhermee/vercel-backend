import mongoose from 'mongoose';

let cachedDb = null;

export async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  try {
    const connection = await mongoose.connect(process.env.MONGO_CONN_STRING);
    
    cachedDb = connection;
    console.log('Database connected successfully');
    return cachedDb;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
}