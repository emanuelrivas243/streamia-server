import { Request, Response } from "express";
import Favorite from "../models/Favorites";

/**
 * @file Favorites Controller
 * @description Handles CRUD operations for user favorites.
 * Includes endpoints for retrieving, adding, and deleting favorite items.
 */

/**
 * Get all favorites for a given user.
 * @route GET /api/favorites/:userId
 * @param {string} req.params.userId - The ID of the user.
 * @returns {Object[]} List of user's favorite items.
 */
export const getFavoritesByUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { userId } = req.params;
    const favorites = await Favorite.find({ userId });
    return res.json(favorites);
  } catch (error) {
    console.error("❌ Error fetching favorites:", error);
    return res.status(500).json({ message: "Failed to fetch favorites." });
  }
};

/**
 * Add a new favorite for a user.
 * @route POST /api/favorites
 * @param {string} req.body.userId - The ID of the user.
 * @param {string} req.body.contentId - The ID of the content being favorited.
 * @returns {Object} The created favorite document.
 */
export const addFavorite = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { userId, contentId } = req.body;

    // Validate required fields
    if (!userId || !contentId) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    // Prevent duplicate favorites
    const existing = await Favorite.findOne({ userId, contentId });
    if (existing) {
      return res.status(400).json({ message: "Content already marked as favorite." });
    }

    // Create new favorite
    const newFavorite = new Favorite({ userId, contentId });
    await newFavorite.save();

    return res.status(201).json(newFavorite);
  } catch (error) {
    console.error("❌ Error adding favorite:", error);
    return res.status(500).json({ message: "Failed to add favorite." });
  }
};

/**
 * Remove a favorite for a user.
 * @route DELETE /api/favorites/:userId/:contentId
 * @param {string} req.params.userId - The ID of the user.
 * @param {string} req.params.contentId - The ID of the content to remove.
 * @returns {Object} A success message or an error message if not found.
 */
export const removeFavorite = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { userId, contentId } = req.params;

    const deleted = await Favorite.findOneAndDelete({ userId, contentId });

    if (!deleted) {
      return res.status(404).json({ message: "Favorite not found." });
    }

    return res.json({ message: "Favorite removed successfully." });
  } catch (error) {
    console.error("❌ Error removing favorite:", error);
    return res.status(500).json({ message: "Failed to remove favorite." });
  }
};
