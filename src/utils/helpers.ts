import crypto from "crypto";
import jwt, { SignOptions } from "jsonwebtoken";

/**
 * Generate a JWT token for a user.
 * @param userId - User ID from MongoDB
 * @param email - User email
 * @returns JWT token valid for 2 hours
 */
export const generateToken = (userId: string, email: string): string => {
  const payload = { id: userId, email };
  const secret = process.env.JWT_SECRET || "fallback_secret_key";
  const options: SignOptions = {    
    expiresIn: (process.env.JWT_EXPIRES_IN as SignOptions["expiresIn"]) || "2h",
  };

  const token = jwt.sign(payload, secret, options);
  return token;
};

/**
 * Verify a JWT token.
 * @param token - JWT token to verify
 * @returns Decoded token payload or null if invalid
 */
export const verifyToken = (
  token: string
): { id: string; email: string } | null => {
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback_secret_key"
    ) as { id: string; email: string };
    return decoded;
  } catch (error) {
    console.error("❌ Token verification failed:", error);
    return null;
  }
};

/**
 * Extract token from Authorization header.
 * Expected format: "Bearer <token>"
 * @param authHeader - Authorization header value
 * @returns Token or null if invalid format
 */
export const extractTokenFromHeader = (authHeader?: string): string | null => {
  if (!authHeader) return null;
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;
  return parts[1];
};

/**
 * Generate a secure reset token for password recovery.
 * Token is a random 32-byte hex string.
 * @returns Secure token string
 */
export const generateResetToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

/**
 * Hash a reset token (for storing in DB).
 * @param token - Plain text token
 * @returns SHA-256 hash of token
 */
export const hashResetToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

/**
 * Calculate expiration time for reset token (1 hour from now).
 * @returns ISO-8601 timestamp
 */
export const getResetTokenExpiration = (): Date => {
  return new Date(Date.now() + 60 * 60 * 1000); // 1 hour
};

/**
 * Check if a date has passed.
 * @param date - Date to check
 * @returns true if date is in the past
 */
export const isExpired = (date: Date): boolean => {
  return new Date() > date;
};