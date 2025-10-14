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
 * 
 * Verifies the JWT token from the Authorization header and attaches user data to the request.
 * If the token is invalid or missing, it returns 401 Unauthorized.
 *
 * @param {Request} req - Express HTTP request object. Must include `Authorization` header with Bearer token.
 * @param {Response} res - Express HTTP response object.
 * @param {NextFunction} next - Express next middleware function.
 *
 * @returns {void} Calls `next()` if authentication succeeds, otherwise sends a 401 or 500 response.
 *
 * @throws {401} If no token is provided or token is invalid/expired.
 * @throws {500} If an unexpected error occurs.
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