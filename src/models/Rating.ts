/**
 * @file ratingModel.ts
 * @description Mongoose model for the "ratings" collection (movie ratings).
 * Defines the structure, validations, and indexes required to record
 * the scores that users assign to movies within the Streamia application.
 */

import mongoose, { Document, Schema } from "mongoose";

/**
 * @interface IRating
 * @extends Document
 * @description Interface that defines the shape of a rating document in MongoDB.
 */
export interface IRating extends Document {
  /** ID of the user who made the rating (reference to the Users collection). */
  userId: mongoose.Types.ObjectId;

  /** ID of the rated movie (reference to the Movies collection). */
  movieId: string;

  /** Rating given by the user to the movie (range 1–5 stars). */
  rating: number;

  /** Date when the record was created. */
  createdAt: Date;

  /** Date when the record was last updated. */
  updatedAt: Date;
}

/**
 * @constant ratingSchema
 * @description Mongoose schema that defines the structure of a rating document.
 */
const ratingSchema = new Schema<IRating>(
  {
    /**
     * ID of the user who gives the rating.
     * Defined as ObjectId to maintain a relationship with the "User" collection.
     */
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User", // reference to the Users collection
      required: true,
      index: true,
    },

    /**
     * ID of the rated movie.
     */
    movieId: {
      type: String,
      required: true,
      index: true,
    },

    /**
     * Numeric value of the rating given (1 to 5).
     */
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
  },
  {
    timestamps: true, // automatically generates createdAt and updatedAt
  }
);

/**
 * @description Compound index (userId + movieId) to ensure that
 * each user can rate a movie only once.
 */
ratingSchema.index({ userId: 1, movieId: 1 }, { unique: true });

/**
 * @exports Rating
 */
export default mongoose.model<IRating>("Rating", ratingSchema);
