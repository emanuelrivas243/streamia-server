/**
 * @file movieController.ts
 * @description Controller for movie management operations.
 * Handles movie uploads, subtitles management, and movie retrieval with Cloudinary integration.
 * @author Streamia Team
 * @version 1.0.0
 * @created 2025-10-26
 * 
 * @module Controllers/Movie
 */

import { Request, Response } from "express";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";
import { uploadSubtitle, uploadToCloudinary } from "../config/cloudinary";
import Movie from "../models/Movie";

/**
 * Multer configuration for temporary file uploads
 * @constant
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

/**
 * Multer middleware instance for file uploads
 * @constant
 */
export const upload = multer({ 
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit for videos
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'video') {
      // Validate video types
      const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
      const ext = path.extname(file.originalname).toLowerCase();
      if (videoExtensions.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error('Only video files are allowed (MP4, MOV, AVI, MKV, WEBM)'));
      }
    } else if (file.fieldname === 'subtitle') {
      // Validate subtitle types
      const ext = path.extname(file.originalname).toLowerCase();
      if (ext === '.vtt' || ext === '.srt') {
        cb(null, true);
      } else {
        cb(new Error('Only subtitle files are allowed (VTT, SRT)'));
      }
    } else {
      cb(new Error('Invalid file field'));
    }
  }
});

/**
 * Simple in-memory cache for performance optimization
 * @constant
 */
const cache = new Map<string, { data: any; expires: number }>();
const CACHE_TTL = 60 * 1000; // 60 seconds

/**
 * Retrieve data from cache
 * @function getFromCache
 * @param {string} key - Cache key
 * @returns {any} Cached data or null if expired/not found
 */
function getFromCache(key: string) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

/**
 * Store data in cache
 * @function setCache
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 */
function setCache(key: string, data: any) {
  cache.set(key, { data, expires: Date.now() + CACHE_TTL });
}

/**
 * Upload a movie to Cloudinary and save to database
 * @async
 * @function uploadMovie
 * @route POST /api/movies/upload
 * @access Private
 * @param {Request} req - Express request object with file and form data
 * @param {Response} res - Express response object
 * @returns {Promise<void>} JSON response with created movie data
 * @throws {Error} If file upload fails or database operation fails
 */
export const uploadMovie = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No video file provided" });
    }

    console.log("📤 Uploading video to Cloudinary...");

    // Upload video to Cloudinary
    const uploadResult = await uploadToCloudinary(req.file.path, {
      folder: 'streamia/movies',
      resource_type: 'video'
    });

    // Create movie in database
    const movieData = {
      title: req.body.title || `Movie ${uploadResult.public_id}`,
      description: req.body.description || "Description not available",
      category: req.body.category || "General",
      coverImage: uploadResult.thumbnail_url,
      videoUrl: uploadResult.secure_url,
      cloudinaryPublicId: uploadResult.public_id,
      videoFormat: uploadResult.format,
      hasAudio: true,
      duration: Math.round(uploadResult.duration),
      provider: 'cloudinary'
    };

    const movie = await Movie.create(movieData);

    // Clean temporary file
    const fs = await import('fs');
    fs.unlinkSync(req.file.path);

    console.log("✅ Video uploaded successfully:", movie.title);

    return res.status(201).json({
      message: "Movie uploaded successfully",
      data: movie
    });
  } catch (error) {
    console.error("❌ Error uploading movie:", error);
    
    // Clean temporary file in case of error
    if (req.file) {
      const fs = await import('fs');
      fs.unlinkSync(req.file.path);
    }

    return res.status(500).json({ 
      error: "Error uploading movie",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};


/**
 * Upload subtitles for a movie
 * @async
 * @function uploadSubtitles
 * @route POST /api/movies/:id/subtitles
 * @access Private
 * @param {Request} req - Express request object with file and subtitle data
 * @param {Response} res - Express response object
 * @returns {Promise<void>} JSON response with updated subtitles list
 * @throws {Error} If file upload fails or movie not found
 */
export const uploadSubtitles = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { language, label } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: "No subtitle file provided" });
    }

    if (!language || !label) {
      return res.status(400).json({ error: "Language and label are required" });
    }

    const movie = await Movie.findById(id);
    if (!movie) {
      return res.status(404).json({ error: "Movie not found" });
    }

    console.log("📝 Uploading subtitles...");

    // Upload subtitles to Cloudinary
    const subtitleResult = await uploadSubtitle(req.file.path, {
      folder: 'streamia/subtitles',
      public_id: `${movie.cloudinaryPublicId}_${language}`
    });

    // Add subtitles to array
    movie.subtitles.push({
      language,
      label,
      url: subtitleResult.secure_url
    });

    await movie.save();

    // Clean temporary file
    const fs = await import('fs');
    fs.unlinkSync(req.file.path);

    console.log("✅ Subtitles added for:", movie.title);

    return res.json({
      message: "Subtitles uploaded successfully",
      data: movie.subtitles
    });
  } catch (error) {
    console.error("❌ Error uploading subtitles:", error);
    
    if (req.file) {
      const fs = await import('fs');
      fs.unlinkSync(req.file.path);
    }

    return res.status(500).json({ 
      error: "Error uploading subtitles",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};


/**
 * Get all movies from database (Cloudinary)
 * @async
 * @function getMovies
 * @route GET /api/movies
 * @access Public
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} JSON response with movies list
 * @throws {Error} If database query fails
 */
export const getMovies = async (req: Request, res: Response) => {
  try {
    const movies = await Movie.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    if (movies.length === 0) {
      return res.status(200).json({
        message: "No movies available. Upload some movies to get started!",
        data: []
      });
    }

    return res.json({ 
      source: "cloudinary", 
      data: movies,
      total: movies.length
    });
  } catch (err) {
    console.error("❌ getMovies error:", err);
    return res.status(500).json({ error: "Error getting movies" });
  }
};

/**
 * Get movie by ID
 * @async
 * @function getMovieById
 * @route GET /api/movies/:id
 * @access Public
 * @param {Request} req - Express request object with movie ID
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} JSON response with movie data
 * @throws {Error} If movie not found or database query fails
 */
export const getMovieById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    let movie = null;

    // Search by MongoDB _id if valid ObjectId
    if (mongoose.Types.ObjectId.isValid(id)) {
      movie = await Movie.findById(id).lean();
    }

    // If not found, search by cloudinaryPublicId
    if (!movie) {
      movie = await Movie.findOne({ cloudinaryPublicId: id }).lean();
    }

    // If not found, search by externalId (for compatibility)
    if (!movie) {
      movie = await Movie.findOne({ externalId: id }).lean();
    }

    if (!movie) {
      return res.status(404).json({ error: "Movie not found" });
    }

    return res.json({ source: "cloudinary", data: movie });
  } catch (err) {
    console.error("getMovieById error:", err);
    return res.status(500).json({ error: "Error getting movie" });
  }
};

/**
 * Enhanced movie exploration with filtering and search
 * @async
 * @function exploreMovies
 * @route GET /api/movies/explore
 * @access Public
 * @param {Request} req - Express request object with query parameters
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} JSON response with filtered movies
 * @throws {Error} If database query fails
 */
export const exploreMovies = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { category, search } = req.query;

    // Build filter object
    const filter: any = {};

    if (category) {
      filter.category = { $regex: category, $options: 'i' };
    }

    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    const movies = await Movie.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    // Handle no results
    if (movies.length === 0) {
      return res.status(200).json({
        message: search ? "No movies found matching your search" : "No movies available in this category",
        data: [],
        filters: { category, search }
      });
    }

    return res.json({
      source: "cloudinary",
      data: movies,
      filters: { category, search },
      total: movies.length
    });
  } catch (error) {
    console.error("❌ Error exploring movies:", error);
    return res.status(500).json({ 
      message: "Error loading movies, please try again later"
    });
  }
};

/**
 * Update a movie by ID
 * @async
 * @function updateMovie
 * @route PUT /api/movies/:id
 * @access Private
 * @param {Request} req - Express request object with update data
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} JSON response with updated movie
 * @throws {Error} If movie not found or update fails
 */
export const updateMovie = async (req: Request, res: Response) => {
  try {
    const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!movie) {
      return res.status(404).json({ error: "Movie not found" });
    }

    return res.json({ message: "Movie updated successfully", data: movie });
  } catch (err) {
    console.error("❌ Error updating movie:", err);
    return res.status(500).json({ error: "Error updating movie" });
  }
};

/**
 * Delete a movie by ID
 * @async
 * @function deleteMovie
 * @route DELETE /api/movies/:id
 * @access Private
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} JSON response with success message
 * @throws {Error} If movie not found or deletion fails
 */
export const deleteMovie = async (req: Request, res: Response) => {
  try {
    const movie = await Movie.findByIdAndDelete(req.params.id);

    if (!movie) {
      return res.status(404).json({ error: "Movie not found" });
    }

    return res.json({ message: "Movie deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting movie:", err);
    return res.status(500).json({ error: "Error deleting movie" });
  }
};

/**
 * Get subtitles for a movie
 * @async
 * @function getMovieSubtitles
 * @route GET /api/movies/:id/subtitles
 * @access Public
 * @param {Request} req - Express request object with movie ID
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} JSON response with movie subtitles
 * @throws {Error} If movie not found or database query fails
 */
export const getMovieSubtitles = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const movie = await Movie.findById(id).select('subtitles title');
    
    if (!movie) {
      return res.status(404).json({ error: "Movie not found" });
    }

    return res.json({
      movie: movie.title,
      subtitles: movie.subtitles
    });
  } catch (error) {
    console.error("❌ Error getting subtitles:", error);
    return res.status(500).json({ error: "Error getting subtitles" });
  }
};