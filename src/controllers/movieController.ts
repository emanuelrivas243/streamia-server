import { Request, Response } from "express";
import mongoose from "mongoose";
import { createClient } from "pexels";
import Movie from "../models/Movie";

/**
 * Movies controller
 *
 * Strategy:
 * - If MongoDB is connected (mongoose.connection.readyState === 1), read from DB.
 * - Otherwise, fallback to Pexels (external) and cache results in memory for 60s.
 *
 * Cache implemented as a simple Map to avoid adding extra deps.
 */

const PEXELS_KEY = process.env.PEXELS_API_KEY;
const pexelsClient = PEXELS_KEY ? createClient(PEXELS_KEY) : null;

// Simple in-memory cache
const cache = new Map<string, { data: any; expires: number }>();
const CACHE_TTL = 60 * 1000; // 60 seconds

function getFromCache(key: string) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: any) {
  cache.set(key, { data, expires: Date.now() + CACHE_TTL });
}

/**
 * Fetch popular videos from Pexels and normalize to simple movie objects.
 */
async function fetchPopularFromPexels(perPage = 6) {
  if (!pexelsClient) {
    throw new Error("PEXELS_API_KEY missing");
  }

  const cached = getFromCache("pexels_popular");
  if (cached) return cached;

  const res = await pexelsClient.videos.popular({ per_page: perPage });

  //  Verificación de tipo segura
  if (!("videos" in res) || !Array.isArray(res.videos)) {
    throw new Error("Unexpected Pexels API response");
  }

  const videos = res.videos.map((v: any) => {
    // Best effort mapping — Pexels returns multiple video_files and pictures
    const file =
      Array.isArray(v.video_files) && v.video_files.length > 0
        ? v.video_files[0]
        : null;

    const image =
      Array.isArray(v.video_pictures) && v.video_pictures.length > 0
        ? v.video_pictures[0].picture
        : undefined;

    return {
      title: v.user?.name || `Video ${v.id}`,
      description: v.url || "",
      category: v.tags ? v.tags.map((t: any) => t.title).join(", ") : "",
      coverImage: image,
      videoUrl: file?.link || undefined,
      externalId: String(v.id),
      duration: v.duration,
      provider: "pexels",
    };
  });

  setCache("pexels_popular", videos);
  return videos;
}

/**
 * GET /api/movies
 * - If DB connected -> return movies from DB.
 * - Else -> return popular movies from Pexels (fallback).
 */
export const getMovies = async (req: Request, res: Response) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      // 🔒 Using DB (requires Atlas credentials from Sara)
      const movies = await Movie.find()
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();
      return res.json({ source: "db", data: movies });
    }

    // Fallback to external API
    if (!pexelsClient)
      return res
        .status(503)
        .json({ error: "External video service unavailable (missing API key)" });

    const movies = await fetchPopularFromPexels(6);
    return res.json({ source: "pexels", data: movies });
  } catch (err) {
    console.error("getMovies error:", err);
    return res.status(500).json({ error: "Failed to fetch movies" });
  }
};

/**
 * GET /api/movies/external/popular
 * Force fetch from Pexels (ignores DB)
 */
export const getExternalPopular = async (req: Request, res: Response) => {
  try {
    if (!pexelsClient)
      return res.status(503).json({ error: "PEXELS_API_KEY not configured" });

    const movies = await fetchPopularFromPexels(10);
    return res.json({ source: "pexels", data: movies });
  } catch (err) {
    console.error("getExternalPopular error:", err);
    return res
      .status(500)
      .json({ error: "Failed to fetch external popular videos" });
  }
};

/**
 * GET /api/movies/:id
 * - If DB connected -> find by _id (DB) or externalId (Pexels).
 * - Else -> fetch from Pexels.
 */
export const getMovieById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      let movie = null;

      // Try to find by MongoDB _id only if it's a valid ObjectId format
      if (mongoose.Types.ObjectId.isValid(id)) {
        movie = await Movie.findById(id).lean();
      }

      // If not found, try to find by externalId (Pexels)
      if (!movie) {
        movie = await Movie.findOne({ externalId: id }).lean();
      }

      if (!movie) {
        return res.status(404).json({ error: "Movie not found" });
      }

      return res.json({ source: "db", data: movie });
    }

    // If DB not connected, fetch from Pexels
    if (!pexelsClient) {
      return res.status(503).json({ error: "Video service unavailable" });
    }

    try {
      const videos = await fetchPopularFromPexels(10);
      const video = videos.find((v: any) => v.externalId === id);

      if (!video) {
        return res.status(404).json({ error: "Movie not found" });
      }

      return res.json({ source: "pexels", data: video });
    } catch (pexelsError) {
      console.error("Error fetching from Pexels:", pexelsError);
      return res
        .status(503)
        .json({ error: "Failed to fetch video from external service" });
    }
  } catch (err) {
    console.error("getMovieById error:", err);
    return res.status(500).json({ error: "Failed to get movie" });
  }
};