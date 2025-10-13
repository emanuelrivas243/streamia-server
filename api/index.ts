import cors from "cors";
import "dotenv/config";
import express, { Request, Response } from "express";
import { connectDB } from "../src/config/db";
import { apiLimiter } from "../src/middlewares/rateLimitMiddleware";
import movieRoutes from "../src/routes/movieRoutes";
import userRoutes from "../src/routes/userRoutes";

/**
 * HTTP server to expose endpoints for streaming platform.
 * - User authentication (register, login, logout, profile management)
 * - Movie catalog (explore, search, filter)
 */
const app = express();

/**
 * CORS configuration.
 * If ORIGIN exists, it is parsed as a comma-separated list.
 * If it doesn't, allow all origins in development.
 */
const allowedOrigins = process.env.ORIGIN?.split(",").map(s => s.trim()).filter(Boolean);

app.use(
  cors({
    origin: function(origin, callback) {
      // Permitir requests sin origin (Postman, mobile, curl)
      if (!origin) return callback(null, true);

      // Si ORIGIN está definido, solo permitir esos
      if (allowedOrigins && allowedOrigins.length > 0) {
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        } else {
          return callback(new Error("CORS policy: Origin not allowed"));
        }
      }

      // Si no hay ORIGIN definido, permitir todo
      return callback(null, true);
    },
    credentials: true,
  })
);


/**
 * Global middleware
 */
app.use(express.json()); // Parse JSON bodies
app.use(apiLimiter); // Apply general rate limiting

/**
 * Routes
 */
app.use("/api/users", userRoutes);
app.use("/api/movies", movieRoutes);

/**
 * Health check endpoint
 */
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({ message: "Streamia Backend API is running" });
});

/**
 * Videos endpoint (Pexels fallback)
 * Returns popular videos from Pexels API
 * Currently fixed at 3 videos
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
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Endpoint not found" });
});

/**
 * Connect to database
 */
connectDB();
// ⚠️ Si no existe MONGODB_URI, mostrará en consola:
// "⚠️ MONGODB_URI not set. Skipping database connection (pending Atlas credentials)."

/**
 * Start server
 */
const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📚 API Documentation:`);
  console.log(`   POST   /api/users/register       - Register new user`);
  console.log(`   POST   /api/users/login          - Login user`);
  console.log(`   POST   /api/users/logout         - Logout user`);
  console.log(`   GET    /api/users/me             - Get user profile (auth required)`);
  console.log(`   PUT    /api/users/me             - Update user profile (auth required)`);
  console.log(`   DELETE /api/users/me             - Delete user account (auth required)`);
  console.log(`   POST   /api/users/forgot-password - Request password reset`);
  console.log(`   POST   /api/users/reset-password  - Reset password`);
  console.log(`   GET    /api/movies               - Get all movies`);
  console.log(`   GET    /api/movies/:id           - Get movie by ID`);
  console.log(`   GET    /api/movies/external/popular - Get popular videos from Pexels`);
});