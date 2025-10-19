import mongoose, { Document, Schema } from "mongoose";

export interface IFavorite extends Document {
  userId: string;
  movieId: string;
  title: string;
  poster: string;
  note?: string;
}

const favoriteSchema = new Schema<IFavorite>(
  {
    userId: { type: String, required: true },
    movieId: { type: String, required: true },
    title: { type: String, required: true },
    poster: { type: String, required: true },
    note: { type: String, default: "" }
  },
  { timestamps: true }
);

export default mongoose.model<IFavorite>("Favorite", favoriteSchema);
