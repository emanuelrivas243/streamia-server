import express from "express";
import {
    exploreMovies,
    getExternalPopular,
    getMovieById,
    getMovies
} from "../controllers/movieController";
import { authenticate } from "../middlewares/authMiddleware";
import { updateMovie, deleteMovie } from "../controllers/movieController";

const router = express.Router();

/**
 * Protected endpoints for movies (authentication required)
 */

/**
 * GET /api/movies
 * Get all movies (with fallback to Pexels if DB not connected)
 */
router.get("/", authenticate, getMovies);

/**
 * GET /api/movies/explore
 * Enhanced movie exploration with filtering and search
 * Supports query parameters: ?category=action&search=matrix
 */
router.get("/explore", authenticate, exploreMovies);


/**
 * GET /api/movies/:id
 * Get movie by ID
 */
router.get("/:id", authenticate, getMovieById);

/**
 * GET /api/movies/external/popular
 * Get popular videos from Pexels (public endpoint for testing)
 */
router.get("/external/popular", getExternalPopular);

/**
 * PUT /api/movies/:id with TOKEN
 * Edit an existing movie local DB only 
 */
router.put("/:id", authenticate, updateMovie);

/**
 * DELETE /api/movies/:id TOKEN
 * Remove a movie from MongoDB local deletion only
 */
router.delete("/:id", authenticate, deleteMovie);

export default router;