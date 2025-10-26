import express from "express";
import { addRating, deleteRating, getUserRatings, updateRating } from "../controllers/ratingsController";
import { authenticate } from "../middlewares/authMiddleware";

const router = express.Router();

//  All rating routes require authentication

/**
 * @route   POST /api/ratings
 * @desc    Create a new rating
 * @access  Private (requires token)
 */
router.post("/", authenticate, addRating);

/**
 * @route   GET /api/ratings/:userId
 * @desc    Get all ratings from a specific user
 * @access  Private
 */
router.get("/:userId", authenticate, getUserRatings);

/**
 * @route   PUT /api/ratings/:id
 * @desc    Update an existing rating
 * @access  Private
 */
router.put("/:id", authenticate, updateRating);

/**
 * @route   DELETE /api/ratings/:id
 * @desc    Delete a rating
 * @access  Private
 */
router.delete("/:id", authenticate, deleteRating);

export default router;
