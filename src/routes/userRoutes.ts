import express from "express";
import {
    deleteUserAccount,
    forgotPassword,
    getUserProfile,
    loginUser,
    logoutUser,
    registerUser,
    resetPassword,
    updateUserProfile,
    changePassword
} from "../controllers/userController";
import { authenticate } from "../middlewares/authMiddleware";
import { loginLimiter } from "../middlewares/rateLimitMiddleware";

const router = express.Router();

/**
 * Public routes (no authentication required)
 */

/**
 * POST /api/users/register
 * Register a new user
 */
router.post("/register", registerUser);

/**
 * POST /api/users/login
 * Login user (with rate limiting)
 */
router.post("/login", loginLimiter, loginUser);

/**
 * POST /api/users/logout
 * Logout user
 */
router.post("/logout", logoutUser);

/**
 * POST /api/users/forgot-password
 * Request password reset
 */
router.post("/forgot-password", forgotPassword);

/**
 * POST /api/users/reset-password
 * Reset password with token
 */
router.post("/reset-password", resetPassword);

/**
 * Protected routes (authentication required)
 */

/**
 * GET /api/users/me
 * Get current user profile
 */
router.get("/me", authenticate, getUserProfile);

/**
 * PUT /api/users/me
 * Update current user profile
 */
router.put("/me", authenticate, updateUserProfile);

/**
 * DELETE /api/users/me
 * Delete current user account
 */
router.delete("/me", authenticate, deleteUserAccount);

/**
 * PUT /api/users/change-password
 */
router.put("/change-password", authenticate, changePassword);

export default router;