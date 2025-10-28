import { Request, Response } from "express";
import Rating from "../models/Rating";

/**
 * @file ratingsController.ts
 * @description Controller for managing movie ratings (US-11 and US-12).
 * Includes creation, update, retrieval, and deletion of ratings.
 */

/**
 * Create or update a rating.
 * @route POST /api/ratings
 * @protected (requires token)
 */
export const addRating = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.userId; // 🔹 provided by the authenticate middleware
    const { movieId, rating } = req.body;

    if (!movieId || rating === undefined) {
      return res.status(400).json({ message: "Missing required fields: movieId, rating" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const existing = await Rating.findOne({ userId, movieId });

    if (existing) {
      existing.rating = rating;
      await existing.save();
      return res.status(200).json({
        message: `Rating updated: ${rating} stars`,
        rating: existing,
      });
    }

    const newRating = new Rating({ userId, movieId, rating });
    await newRating.save();

    return res.status(201).json({
      message: `Rating created: ${rating} stars`,
      rating: newRating,
    });
  } catch (error) {
    console.error("❌ Error adding/updating rating:", error);
    return res.status(500).json({ message: "Failed to save rating" });
  }
};

/**
 * Get all ratings for the authenticated user.
 * @route GET /api/ratings
 * @protected
 */
export const getUserRatings = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.userId;
    const ratings = await Rating.find({ userId });

    if (!ratings || ratings.length === 0) {
      return res.status(404).json({ message: "No ratings found for this user" });
    }

    return res.status(200).json(ratings);
  } catch (error) {
    console.error("❌ Error fetching ratings:", error);
    return res.status(500).json({ message: "Failed to fetch ratings" });
  }
};

/**
 * Update an existing rating.
 * @route PUT /api/ratings/:id
 * @protected
 */
export const updateRating = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { rating } = req.body;

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const existing = await Rating.findById(id);

    if (!existing) {
      return res.status(404).json({ message: "Rating not found" });
    }

    if (existing.userId.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized to update this rating" });
    }

    existing.rating = rating;
    await existing.save();

    return res.status(200).json({
      message: "Rating updated successfully",
      rating: existing,
    });
  } catch (error) {
    console.error("❌ Error updating rating:", error);
    return res.status(500).json({ message: "Failed to update rating" });
  }
};

/**
 * Delete a rating.
 * @route DELETE /api/ratings/:id
 * @protected
 */
export const deleteRating = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const existing = await Rating.findById(id);
    if (!existing) {
      return res.status(404).json({ message: "Rating not found" });
    }

    if (existing.userId.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized to delete this rating" });
    }

    await existing.deleteOne();
    return res.status(200).json({ message: "Rating deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting rating:", error);
    return res.status(500).json({ message: "Failed to delete rating" });
  }
};
