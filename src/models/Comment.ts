/**
 * @file Comment.ts
 * @description Modelo de Mongoose para los comentarios de las películas.
 * Cada comentario pertenece a un usuario y a una película.
 */

import mongoose, { Document, Schema } from "mongoose";

export interface IComment extends Document {
  userId: mongoose.Types.ObjectId;
  movieId: string;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

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

export default mongoose.model<IComment>("Comment", commentSchema);
