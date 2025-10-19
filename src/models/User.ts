import mongoose, { Document, Schema } from "mongoose";

/**
 * Interface representing a user document in MongoDB.
 */
export interface IUser extends Document {
  firstName: string;
  lastName: string;
  age: number;
  email: string;
  password: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose schema for the User model.
 * Email has unique constraint which automatically creates an index.
 */
const userSchema = new Schema<IUser>(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    age: {
      type: Number,
      required: true,
      min: 13,
      max: 150,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
  },
  { timestamps: true }
);

/**
 * User model.
 */
export const User =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema);
export default User;