import cors from "cors";
import "dotenv/config";
import express, { Request, Response } from "express";
import { connectDB } from "../src/config/db";
import { apiLimiter } from "../src/middlewares/rateLimitMiddleware";
import favoritesRoutes from "../src/routes/favoritesRoutes";
import movieRoutes from "../src/routes/movieRoutes";
import userRoutes from "../src/routes/userRoutes";

/**
 * @fileoverview
 * Main entry point for the Streamia backend API.
 * Configures Express server, middlewares, routes, CORS, and database connection.
 *
 * @module Server
 * @requires express
 * @requires dotenv/config
 * @requires cors
 * @requires ../src/config/db
 * @requires ../src/middlewares/rateLimitMiddleware
 * @requires ../src/routes/favoritesRoutes
 * @requires ../src/routes/movieRoutes
 * @requires ../src/routes/userRoutes
 */

/**
 * Initialize Express application.
 * @constant {import("express").Application}
 */
const app = express();

/**
 * CORS configuration.
 * - If the environment variable ORIGIN exists, only allow those domains.
 * - If it doesn't, allow all origins (useful for local development and Postman).
 */
const allowedOrigins = process.env.ORIGIN?.split(",").map(s => s.trim()).filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // Allow Postman, mobile, curl, etc.

      if (allowedOrigins && allowedOrigins.length > 0) {
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        } else {
          return callback(new Error("CORS policy: Origin not allowed"));
        }
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

/**
 * Global middlewares
 */
app.use(express.json()); // Parse incoming JSON requests
app.use(apiLimiter); // Apply rate limit globally

/**
 * Application routes
 * @section Routes
 */
app.use("/api/users", userRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/favorites", favoritesRoutes);

/**
 * Health check endpoint
 * @route GET /
 * @returns {object} 200 - API running status
 */
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({ message: "Streamia Backend API is running" });
});

/**
 * Videos endpoint (Pexels fallback)
 * @route GET /videos/popular
 * @description Fetches 3 popular videos from the Pexels API.
 */
app.get("/videos/popular", async (req: Request, res: Response) => {
  try {
    const { createClient } = await import("pexels");
    const client = createClient(process.env.PEXELS_API_KEY as string);
    const data = await client.videos.popular({ per_page: 3 });
    res.json(data);
  } catch (err) {
    console.error("❌ Error fetching popular videos:", err);
    res.status(500).json({ error: "Failed to fetch popular videos" });
  }
});

/**
 * Catch-all route for undefined endpoints.
 * @returns {object} 404 - Not Found
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Endpoint not found" });
});

/**
 * Connect to MongoDB Atlas.
 */
connectDB();

/**
 * Start the Express server.
 * @constant {number} PORT - Port number defined in .env or defaults to 3000
 */
const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📚 API Documentation:`);
  console.log(`   POST   /api/users/register        - Register new user`);
  console.log(`   POST   /api/users/login           - Login user`);
  console.log(`   POST   /api/users/logout          - Logout user`);
  console.log(`   GET    /api/users/me              - Get user profile (auth required)`);
  console.log(`   PUT    /api/users/me              - Update user profile (auth required)`);
  console.log(`   DELETE /api/users/me              - Delete user account (auth required)`);
  console.log(`   POST   /api/users/forgot-password - Request password reset`);
  console.log(`   POST   /api/users/reset-password  - Reset password`);
  console.log(`   GET    /api/movies                - Get all movies`);
  console.log(`   GET    /api/movies/:id            - Get movie by ID`);
  console.log(`   GET    /api/movies/external/popular - Get popular videos from Pexels`);
  console.log(`   POST   /api/favorites             - Add favorite (auth required)`);
  console.log(`   GET    /api/favorites/:userId     - Get favorites (auth required)`);
  console.log(`   DELETE /api/favorites/:userId/:movieId - Remove favorite (auth required)`);
});
