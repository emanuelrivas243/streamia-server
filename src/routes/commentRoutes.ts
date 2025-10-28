import express from "express";
import {
    createComment,
    deleteComment,
    getCommentsByMovie,
    getCommentsByMovieId,
    updateComment,
} from "../controllers/commentController";
import { authenticate } from "../middlewares/authMiddleware";

const router = express.Router();

/**
 * @route POST /api/comments
 * @desc Create a new comment (authenticated)
 */
router.post("/", authenticate, createComment);

/**
 * @route GET /api/comments/:movieId
 * @desc Get all comments for a specific movie
 */
router.get("/:movieId", getCommentsByMovie);

/**
 * @route GET /api/comments/movie/:movieId
 * @desc Get all comments for a specific movie (alternative endpoint)
 */
router.get("/movie/:movieId", getCommentsByMovieId);

/**
 * @route PUT /api/comments/:id
 * @desc Update a user's own comment (authenticated)
 */
router.put("/:id", authenticate, updateComment);

/**
 * @route DELETE /api/comments/:id
 * @desc Delete a user's own comment (authenticated)
 */
router.delete("/:id", authenticate, deleteComment);

export default router;