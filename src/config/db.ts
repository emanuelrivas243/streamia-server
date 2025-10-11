import mongoose from "mongoose";

/**
 * Connects to MongoDB Atlas using the MONGODB_URI environment variable.
 * If MONGODB_URI is not defined, the function logs a warning and returns,
 * so development can continue until real credentials are provided.
 *
 * @returns Promise<void>
 */
export const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    // Pending: Atlas credentials from Sara. Safe to run server without DB for now.
    console.warn(
      "⚠️ MONGODB_URI not set. Skipping database connection (pending Atlas credentials)."
    );
    return;
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`✅ Connected to MongoDB Atlas: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ Error connecting to MongoDB Atlas:", error);
    // Exit so production won't run without DB; in dev you can change this behavior if desired.
    process.exit(1);
  }
};

export default connectDB;
