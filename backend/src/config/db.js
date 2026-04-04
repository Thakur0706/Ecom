import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDatabase() {
  if (!env.mongodbUri) {
    throw new Error('MONGODB_URI is missing. Add it in backend/.env before starting the server.');
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongodbUri);
}
