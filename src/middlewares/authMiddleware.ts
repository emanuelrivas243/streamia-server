import { NextFunction, Request, Response } from "express";
import { extractTokenFromHeader, verifyToken } from "../utils/helpers";

/**
 * Extend Express Request to include user data.
 */
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
    }
  }
}

/**
 * Authentication middleware.
 * Verifies JWT token from Authorization header and attaches user data to request.
 * If token is invalid or missing, returns 401 Unauthorized.
 */
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      res.status(401).json({ error: "No token provided" });
      return;
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      res.status(401).json({ error: "Invalid or expired token" });
      return;
    }

    // Attach user data to request
    req.userId = decoded.id;
    req.userEmail = decoded.email;

    next();
  } catch (error) {
    console.error("❌ Authentication middleware error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};