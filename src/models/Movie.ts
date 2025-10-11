import mongoose, { Document, Schema } from "mongoose";

/**
 * Interface for a Movie document.
 */
export interface IMovie extends Document {
  title: string;
  description?: string;
  category?: string;
  coverImage?: string;
  videoUrl?: string;
  externalId?: string; // id from external provider (e.g. Pexels)
  duration?: number;
  provider?: string; // e.g. "pexels"
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose schema for movies.
 */
const movieSchema = new Schema<IMovie>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String },
    category: { type: String },
    coverImage: { type: String },
    videoUrl: { type: String },
    externalId: { type: String, index: true },
    duration: { type: Number },
    provider: { type: String, default: "pexels" },
  },
  { timestamps: true }
);

/**
 * Movie model.
 */
export const Movie = mongoose.models.Movie || mongoose.model<IMovie>("Movie", movieSchema);
export default Movie;