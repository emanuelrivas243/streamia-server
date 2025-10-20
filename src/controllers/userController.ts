import bcryptjs from "bcryptjs";
import { Request, Response } from "express";
import { User } from "../models/User";
import { sendWelcomeEmail } from "../utils/emailService";
import { generateResetToken, generateToken, getResetTokenExpiration, hashResetToken, isExpired } from "../utils/helpers";
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema, updateProfileSchema } from "../utils/validators";
import crypto from "crypto";
import { sendMail } from "../utils/mailer";


/**
 * Registers a new user.
 * POST /api/users/register
 *
 * Validates the input data, checks if the email is already in use,
 * hashes the password, creates the user, and sends a welcome email.
 *
 * @param {Request} req - Express HTTP request object. The `req.body` should include:
 *   - firstName {string} - User's first name.
 *   - lastName {string} - User's last name.
 *   - age {number} - User's age.
 *   - email {string} - User's email address.
 *   - password {string} - User's password.
 *   - confirmPassword {string} - Confirmation of the password.
 * @param {Response} res - Express HTTP response object.
 *
 * @returns {Promise<void>} Does not return a value. Sends the HTTP response directly.
 *
 * @throws {400} Validation error if the input data does not match the schema.
 * @throws {409} If the email is already registered.
 * @throws {500} Internal server error.
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
        age: newUser.age,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error("❌ Error in registerUser:", error);
    res.status(500).json({ error: "Please try again later" });
  }
};


/**
 * Logs in a user and returns a JWT token.
 * POST /api/users/login
 *
 * Validates the input data, checks the user's credentials,
 * and returns a JWT token if authentication is successful.
 *
 * @param {Request} req - Express HTTP request object. The `req.body` should include:
 *   - email {string} - User's email address.
 *   - password {string} - User's password.
 * @param {Response} res - Express HTTP response object.
 *
 * @returns {Promise<void>} Does not return a value. Sends the HTTP response directly.
 *
 * @throws {400} Validation error if the input data does not match the schema.
 * @throws {401} If email or password is incorrect.
 * @throws {500} Internal server error.
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
        age: user.age,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("❌ Error in loginUser:", error);
    res.status(500).json({ error: "Try again later" });
  }
};


/**
 * Logs out a user (frontend should remove the token).
 * POST /api/users/logout
 *
 * @param {Request} req - Express HTTP request object.
 * @param {Response} res - Express HTTP response object.
 *
 * @returns {Promise<void>} Sends a success message.
 *
 * @throws {500} Internal server error.
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
 * Retrieves the authenticated user's profile.
 * GET /api/users/me
 *
 * Requires authentication. The `req.userId` must be set (e.g., via middleware after verifying a JWT).
 *
 * @param {Request} req - Express HTTP request object. Must include `req.userId` from authentication middleware.
 * @param {Response} res - Express HTTP response object.
 *
 * @returns {Promise<void>} Sends the user's profile in the response.
 *
 * @throws {401} If the user is not authenticated (missing `req.userId`).
 * @throws {404} If the user is not found in the database.
 * @throws {500} Internal server error.
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
 * Updates the authenticated user's profile.
 * PUT /api/users/me
 *
 * Requires authentication. The `req.userId` must be set (e.g., via middleware after verifying a JWT).
 * Only the provided fields in `req.body` will be updated.
 *
 * @param {Request} req - Express HTTP request object. Must include `req.userId` from authentication middleware.
 *                        The `req.body` can include the following optional fields:
 *   - firstName {string} - New first name.
 *   - lastName {string} - New last name.
 *   - age {number} - New age.
 *   - email {string} - New email address (must be unique).
 * @param {Response} res - Express HTTP response object.
 *
 * @returns {Promise<void>} Sends a success message with the updated user profile.
 *
 * @throws {400} Validation error if the input data does not match the schema.
 * @throws {401} If the user is not authenticated (missing `req.userId`).
 * @throws {404} If the user is not found in the database.
 * @throws {409} If the new email is already in use by another user.
 * @throws {500} Internal server error.
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
 * Requests a password reset for a user.
 * POST /api/users/forgot-password
 *
 * Generates a password reset token, saves it to the user record with an expiration time,
 * and sends an email with a reset link to the user.
 *
 * @param {Request} req - Express HTTP request object. The `req.body` should include:
 *   - email {string} - Email address of the user requesting a password reset.
 * @param {Response} res - Express HTTP response object.
 *
 * @returns {Promise<void>} Sends a success message if the email was sent.
 *
 * @throws {400} If no user exists with the provided email address.
 * @throws {500} Internal server error if there is a problem processing the request.
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
 * Resets a user's password using a valid reset token.
 * POST /api/users/reset-password
 *
 * Validates the input data, verifies the reset token, hashes the new password,
 * and updates the user's password in the database.
 *
 * @param {Request} req - Express HTTP request object. The `req.body` should include:
 *   - token {string} - The password reset token received by email.
 *   - newPassword {string} - The new password to set.
 *   - confirmPassword {string} - Confirmation of the new password.
 * @param {Response} res - Express HTTP response object.
 *
 * @returns {Promise<void>} Sends a success message if the password was updated.
 *
 * @throws {400} Validation error if input data does not match the schema or token is invalid/expired.
 * @throws {500} Internal server error if there is a problem updating the password.
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
      res.status(400).json({ error: "Expired or invalid token" });
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


/**
 * Changes the authenticated user's password.
 * PUT /api/users/change-password
 *
 * Requires authentication. The `req.userId` must come from your auth middleware.
 *
 * @param {Request} req - Express request object. The `req.body` should include:
 *   - currentPassword {string} - The user's existing password.
 *   - newPassword {string} - The new password to set.
 * @param {Response} res - Express response object.
 *
 * @returns {Promise<void>} Sends a success message or an error message.
 *
 * @throws {400} If data is missing or current password is incorrect.
 * @throws {401} If the user is not authenticated.
 * @throws {404} If the user does not exist.
 * @throws {500} Internal server error.
 */

export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: "Current and new password are required." });
      return;
    }

    // Find user and include password
    const user = await User.findById(req.userId).select("+password");
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Compare current password
    const isMatch = await bcryptjs.compare(currentPassword, user.password);
    if (!isMatch) {
      res.status(400).json({ error: "Incorrect current password" });
      return;
    }

    // Hash and update new password
    user.password = await bcryptjs.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("❌ Error in changePassword:", error);
    res.status(500).json({ error: "Failed to change password" });
  }
};
