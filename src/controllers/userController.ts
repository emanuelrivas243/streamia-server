import bcryptjs from "bcryptjs";
import { Request, Response } from "express";
import { User } from "../models/User";
import { sendPasswordResetEmail, sendWelcomeEmail } from "../utils/emailService";
import { generateResetToken, generateToken, getResetTokenExpiration, hashResetToken, isExpired } from "../utils/helpers";
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema, updateProfileSchema } from "../utils/validators";
import crypto from "crypto";
import { sendMail } from "../utils/mailer";


/**
 * Register a new user.
 * POST /api/users/register
 * Body: { firstName, lastName, age, email, password, confirmPassword }
 */
export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate input
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: "Validation error", details: validation.error.flatten() });
      return;
    }

    const { firstName, lastName, age, email, password } = validation.data;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409).json({ error: "This email is already used" });
      return;
    }

    // Hash password with bcryptjs (10 salt rounds)
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create new user
    const newUser = await User.create({
      firstName,
      lastName,
      age,
      email,
      password: hashedPassword,
    });

    // Send welcome email (non-blocking)
    sendWelcomeEmail(email, firstName).catch((err) =>
      console.error("Error to send welcome email", err)
    );

    res.status(201).json({
      message: "Created account successfully.",
      user: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error("❌ Error in registerUser:", error);
    res.status(500).json({ error: "Please try again later" });
  }
};

/**
 * Login user and return JWT token.
 * POST /api/users/login
 * Body: { email, password }
 */
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate input
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: "Validation error", details: validation.error.flatten() });
      return;
    }

    const { email, password } = validation.data;

    // Find user and include password field
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      res.status(401).json({ error: "Email or password incorrect" });
      return;
    }

    // Compare passwords
    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ error: "Email or password invalid" });
      return;
    }

    // Generate JWT token
    const token = generateToken(user._id.toString(), user.email);

    res.status(200).json({
      message: "Login succesful!",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("❌ Error in loginUser:", error);
    res.status(500).json({ error: "Try again later" });
  }
};

/**
 * Logout user (frontend removes token).
 * POST /api/users/logout
 */
export const logoutUser = async (req: Request, res: Response): Promise<void> => {
  try {
    res.status(200).json({ message: "Created session succesfully." });
  } catch (error) {
    console.error("❌ Error in logoutUser:", error);
    res.status(500).json({ error: "Try again later." });
  }
};

/**
 * Get user profile (requires authentication).
 * GET /api/users/me
 */
export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    res.status(200).json({
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        age: user.age,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("❌ Error in getUserProfile:", error);
    res.status(500).json({ error: "We were unable to obtain your profile." });
  }
};

/**
 * Update user profile (requires authentication).
 * PUT /api/users/me
 * Body: { firstName?, lastName?, age?, email? }
 */
export const updateUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Validate input
    const validation = updateProfileSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: "Validation error", details: validation.error.flatten() });
      return;
    }

    const { firstName, lastName, age, email } = validation.data;

    // Check if new email is already in use (if provided)
    if (email) {
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser._id.toString() !== req.userId) {
        res.status(409).json({ error: "This email is already registered." });
        return;
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(age && { age }),
        ...(email && { email }),
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    res.status(200).json({
      message: "Updated profile.",
      user: {
        id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        age: updatedUser.age,
        email: updatedUser.email,
        updatedAt: updatedUser.updatedAt,
      },
    });
  } catch (error) {
    console.error("❌ Error in updateUserProfile:", error);
    res.status(500).json({ error: "Please try again later." });
  }
};

/**
 * Delete user account (requires authentication).
 * DELETE /api/users/me
 * Body: { password }
 */
export const deleteUserAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { password } = req.body;

    if (!password) {
      res.status(400).json({ error: "Password required." });
      return;
    }

    // Find user with password field
    const user = await User.findById(req.userId).select("+password");
    if (!user) {
      res.status(404).json({ error: "User Not Found." });
      return;
    }

    // Verify password
    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ error: "Incorrect password" });
      return;
    }

    // Delete user
    await User.findByIdAndDelete(req.userId);

    res.status(204).send();
  } catch (error) {
    console.error("❌ Error in deleteUserAccount:", error);
    res.status(500).json({ error: "Please try again later" });
  }
};

/**
 * Request password reset.
 * POST /api/users/forgot-password
 * Body: { email }
 */
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      res.status(400).json({ error: "There is no user with this email address." });
      return;
    }

    // Generar token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 3600000); // 1 hora
    await user.save({ validateBeforeSave: false });

    // URL del frontend
    const frontendURL = process.env.FRONTEND_URL || "http://localhost:3000";
    const resetURL = `${frontendURL}/reset-password/${resetToken}`;

    const htmlContent = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>Password Reset</h2>
      <p>Hello ${user.firstName},</p>
      <p>You have requested to reset your password. Click the link below:</p>
      <a href="${resetURL}" target="_blank" style="color: #007bff;">
        ${resetURL}
      </a>
      <p>If you did not request this change, please ignore this message.</p>
    </div>
  `;

    await sendMail(
      user.email,
      "Reset your password",
      htmlContent
    );

    res.status(200).json({ message: "Email sent to reset password" });
  } catch (error) {
    console.error("Error in forgotPassword:", error);
    res.status(500).json({ error: "Error processing the request" });
  }
};

/**
 * Reset password with token.
 * POST /api/users/reset-password
 * Body: { token, newPassword, confirmPassword }
 */
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = resetPasswordSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: "Validation error", details: validation.error.flatten() });
      return;
    }

    const { token, newPassword } = validation.data;

    // Hashing received token
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Search user with a valid token
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    }).select("+passwordResetToken +passwordResetExpires +password");

    if (!user) {
      res.status(400).json({ error: "Token inválido o expirado" });
      return;
    }

    // Update password
    user.password = await bcryptjs.hash(newPassword, 10);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Updated password succesfully" });
  } catch (error) {
    console.error("Error in resetPassword:", error);
    res.status(500).json({ error: "Error resetting password" });
  }
};
