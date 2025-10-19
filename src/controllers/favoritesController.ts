import { Request, Response } from "express";
import Favorite from "../models/Favorites";

/**
 * @file Favorites Controller
 * @description Handles CRUD operations for user favorites.
 * Includes endpoints for retrieving, adding, updating and deleting favorite items.
 */

/**
 * Get all favorites for the authenticated user.
 * @route GET /api/favorites
 * @access Private
 * @returns {Object[]} List of user's favorite items.
 */
export const getFavoritesByUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const favorites = await Favorite.find({ userId });
  
    if (favorites.length === 0) {
      return res.status(200).json({ 
        message: "You don't have any favorite movies yet",
        favorites: []
      });
    }  
    return res.json(favorites);
  } catch (error) {
    console.error("❌ Error fetching favorites:", error);
    return res.status(500).json({ message: "Failed to load your favorites, please try again later" });
  }
};

/**
 * Add a new favorite for the authenticated user.
 * @route POST /api/favorites
 * @access Private
 * @param {string} req.body.movieId - The ID of the movie being favorited.
 * @param {string} req.body.title - The movie title.
 * @param {string} req.body.poster - The movie poster URL.
 * @returns {Object} The created favorite document.
 */
export const addFavorite = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.userId;
    const { movieId, title, poster, note } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Validate required fields
    if (!movieId || !title || !poster) {
      return res.status(400).json({ message: "Missing required fields: movieId, title, poster" });
    }

    // Prevent duplicate favorites
    const existing = await Favorite.findOne({ userId, movieId });
    if (existing) {
      return res.status(409).json({ message: "This movie is already in your favorites" });
    }

    // Create new favorite
    const newFavorite = new Favorite({
      userId,
      movieId,
      title,
      poster,
      note: note || ""
    });

    await newFavorite.save();
    return res.status(201).json(newFavorite);
  } catch (error) {
    console.error("❌ Error adding favorite:", error);
    return res.status(500).json({ message: "Failed to add movie to favorites, please try again later" });
  }
};

/**
 * Update a favorite's note for the authenticated user.
 * @route PUT /api/favorites/:id
 * @access Private
 * @param {string} req.params.id - The ID of the favorite document.
 * @param {string} req.body.note - The new note content.
 * @returns {Object} The updated favorite document.
 */
export const updateFavoriteNote = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { note } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (!id) {
      return res.status(400).json({ message: "Favorite ID is required" });
    }

    // Find favorite and verify ownership
    const favorite = await Favorite.findOne({ _id: id, userId });
    if (!favorite) {
      return res.status(404).json({ message: "Favorite not found" });
    }

    // Update the note
    favorite.note = note || "";
    await favorite.save();

    return res.json({
      message: "Favorite updated successfully",
      favorite
    });
  } catch (error) {
    console.error("❌ Error updating favorite note:", error);
    return res.status(500).json({ message: "Failed to update favorite" });
  }
};

/**
 * Remove a favorite for the authenticated user.
 * @route DELETE /api/favorites/:movieId
 * @access Private
 * @param {string} req.params.movieId - The ID of the movie to remove.
 * @returns {Object} A success message or an error message if not found.
 */
export const removeFavorite = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.userId;
    const { movieId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    
    if (!movieId) {
      return res.status(400).json({ message: "Movie ID is required" });
    }   

    const deleted = await Favorite.findOneAndDelete({ userId, movieId });

    if (!deleted) {
      return res.status(404).json({ message: "Movie not found or already removed" });
    }
    return res.json({ 
      message: "Movie removed from favorites successfully",
      removedMovie: {
        movieId: deleted.movieId,
        title: deleted.title
      }
    }); 
  } catch (error) {
    console.error("❌ Error removing favorite:", error);
    return res.status(500).json({ message: "Failed to remove favorite" });
  }
};