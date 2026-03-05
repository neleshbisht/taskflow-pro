import mongoose from "mongoose";

export default async function connectDB(MONGO_URI) {
  if (!MONGO_URI) {
    throw new Error("MONGO_URI is missing");
  }

  mongoose.set("strictQuery", true);

  await mongoose.connect(MONGO_URI);

  console.log("✅ MongoDB connected");
}