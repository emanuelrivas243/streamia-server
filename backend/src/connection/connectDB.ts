import mongoose from "mongoose";

export const connectDB = async (): Promise<void> => {
  try {
    const uri = process.env.MONGO_URI as string;
    if (!uri) {
      throw new Error("Error ");
    }

    await mongoose.connect(uri);
    console.log("Conectado a MongoDB :b");
  } catch (error) {
    console.error("Error conectando a MongoDB:", error);
  }
};
