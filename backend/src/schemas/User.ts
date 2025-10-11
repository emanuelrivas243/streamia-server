import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  name: string;
  surname: string;
  age: number;
  email: string;
  password: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
}

const userSchema: Schema<IUser> = new Schema(
  {
    name: { type: String, required: true },
    surname: { type: String, required: true },
    age: { type: Number, required: true, min: 13 },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, minlength: 8 },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
  },
  { timestamps: true }
);

const User = mongoose.model<IUser>("User", userSchema);
export default User;
