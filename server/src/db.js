
import mongoose from "mongoose";

let cached = globalThis.__pugazhMongo;

if (!cached) {
  cached = globalThis.__pugazhMongo = {
    connection: null,
    promise: null
  };
}

export async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI environment variable is missing.");
  }

  if (cached.connection) {
    return cached.connection;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000
    }).catch((error) => {
      cached.promise = null;
      throw error;
    });
  }

  cached.connection = await cached.promise;
  return cached.connection;
}
