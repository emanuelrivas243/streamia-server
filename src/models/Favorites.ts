import mongoose, { Document, Schema } from "mongoose";

export interface IFavorite extends Document {
  userId: string;
  contentId: string;
}

const favoriteSchema = new Schema<IFavorite>({
  userId: { type: String, required: true },
  contentId: { type: String, required: true },
});

export default mongoose.model<IFavorite>("Favorite", favoriteSchema);
