/**
 * @file Comment.ts
 * @description Mongoose model for movie comments.
 * Each comment belongs to a specific user and movie.
 * Includes timestamps for creation and update times.
 * @module Models/Comment
 * @version 1.0.0
 * @created 2025-10-26
 */

import mongoose, { Document, Schema } from "mongoose";

/**
 * @interface IComment
 * @description Defines the structure of a comment document in MongoDB.
 * @property {mongoose.Types.ObjectId} userId - Reference to the user who created the comment.
 * @property {string} movieId - Identifier of the associated movie (could be internal or Cloudinary ID).
 * @property {string} text - The content of the comment, limited to 500 characters.
 * @property {Date} createdAt - Timestamp when the comment was created.
 * @property {Date} updatedAt - Timestamp when the comment was last updated.
 */
export interface IComment extends Document {
  userId: mongoose.Types.ObjectId;
  movieId: string;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}


/**
 * @constant commentSchema
 * @description Mongoose schema definition for the Comment model.
 */
const commentSchema = new Schema<IComment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    movieId: {
      type: String,
      required: true,
      index: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500, // límite de caracteres por comentario
    },
  },
  {
    timestamps: true,
  }
);

/**
 * @description Exports the Mongoose model for movie comments.
 * @exports Comment
 */
export default mongoose.model<IComment>("Comment", commentSchema);
