import mongoose from 'mongoose';

export async function connectDB(): Promise<boolean> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('MONGODB_URI not set; continuing without DB connection');
    return false;
  }
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');
    return true;
  } catch (err) {
    console.warn('MongoDB connection failed; continuing without DB. Error:', (err as Error).message);
    return false;
  }
}
