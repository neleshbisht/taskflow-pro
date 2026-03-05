import mongoose from "mongoose";

export async function connectDB(uri) {
  if (!uri) {
    console.error("❌ MONGO_URI missing");
    process.exit(1);
  }
  try {
    await mongoose.connect(uri);
    console.log("✅ MongoDB connected");
  } catch (e) {
    console.error("❌ MongoDB connection failed:", e.message);
    process.exit(1);
  }
}