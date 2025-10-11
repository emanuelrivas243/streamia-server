import rateLimit from "express-rate-limit";

/**
 * Rate limiter for login attempts.
 * Limits to 5 requests per 10 minutes per IP address.
 * Returns 429 Too Many Requests when exceeded.
 */
export const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // 5 requests per windowMs
  message: "Too many login attempts, please try again later",
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => process.env.NODE_ENV === "development", // Skip in development
});

/**
 * General rate limiter for API endpoints.
 * Limits to 100 requests per 15 minutes per IP address.
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per windowMs
  message: "Too many requests from this IP, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === "development",
});