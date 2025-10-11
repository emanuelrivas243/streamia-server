import bcryptjs from "bcryptjs";
import { Request, Response } from "express";
import { User } from "../models/User";
import { sendPasswordResetEmail, sendWelcomeEmail } from "../utils/emailService";
import { generateResetToken, generateToken, getResetTokenExpiration, hashResetToken, isExpired } from "../utils/helpers";
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema, updateProfileSchema } from "../utils/validators";

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
      res.status(409).json({ error: "Este correo ya está registrado" });
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
      console.error("Error sending welcome email:", err)
    );

    res.status(201).json({
      message: "Cuenta creada con éxito",
      user: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error("❌ Error in registerUser:", error);
    res.status(500).json({ error: "Inténtalo de nuevo más tarde" });
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
      res.status(401).json({ error: "Correo o contraseña inválidos" });
      return;
    }

    // Compare passwords
    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ error: "Correo o contraseña inválidos" });
      return;
    }

    // Generate JWT token
    const token = generateToken(user._id.toString(), user.email);

    res.status(200).json({
      message: "Login successful",
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
    res.status(500).json({ error: "Inténtalo de nuevo más tarde" });
  }
};

/**
 * Logout user (frontend removes token).
 * POST /api/users/logout
 */
export const logoutUser = async (req: Request, res: Response): Promise<void> => {
  try {
    res.status(200).json({ message: "Sesión cerrada correctamente" });
  } catch (error) {
    console.error("❌ Error in logoutUser:", error);
    res.status(500).json({ error: "Inténtalo de nuevo más tarde" });
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
      res.status(404).json({ error: "Usuario no encontrado" });
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
    res.status(500).json({ error: "No pudimos obtener tu perfil" });
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
        res.status(409).json({ error: "Este correo ya está registrado" });
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
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }

    res.status(200).json({
      message: "Perfil actualizado",
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
    res.status(500).json({ error: "Inténtalo de nuevo más tarde" });
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
      res.status(400).json({ error: "Password is required" });
      return;
    }

    // Find user with password field
    const user = await User.findById(req.userId).select("+password");
    if (!user) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return;
    }

    // Verify password
    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ error: "Contraseña incorrecta" });
      return;
    }

    // Delete user
    await User.findByIdAndDelete(req.userId);

    res.status(204).send();
  } catch (error) {
    console.error("❌ Error in deleteUserAccount:", error);
    res.status(500).json({ error: "Inténtalo de nuevo más tarde" });
  }
};

/**
 * Request password reset.
 * POST /api/users/forgot-password
 * Body: { email }
 */
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate input
    const validation = forgotPasswordSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: "Validation error", details: validation.error.flatten() });
      return;
    }

    const { email } = validation.data;

    // Find user (don't reveal if email exists for security)
    const user = await User.findOne({ email });
    if (!user) {
      res.status(202).json({ message: "Revisa tu correo para continuar" });
      return;
    }

    // Generate reset token
    const resetToken = generateResetToken();
    const hashedToken = hashResetToken(resetToken);
    const expiresAt = getResetTokenExpiration();

    // Save token and expiration to DB
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = expiresAt;
    await user.save();

    // Create reset link
    const resetLink = `${process.env.ORIGIN?.split(",")[0]}/reset?token=${resetToken}`;

    // Send email
    await sendPasswordResetEmail(email, resetLink);

    res.status(200).json({ message: "Revisa tu correo para continuar" });
  } catch (error) {
    console.error("❌ Error in forgotPassword:", error);
    res.status(500).json({ error: "Inténtalo de nuevo más tarde" });
  }
};

/**
 * Reset password with token.
 * POST /api/users/reset-password
 * Body: { token, newPassword, confirmPassword }
 */
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate input
    const validation = resetPasswordSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: "Validation error", details: validation.error.flatten() });
      return;
    }

    const { token, newPassword } = validation.data;

    // Hash the provided token to compare with DB
    const hashedToken = hashResetToken(token);

    // Find user with reset token
    const user = await User.findOne({
      passwordResetToken: hashedToken,
    }).select("+passwordResetToken +passwordResetExpires");

    if (!user) {
      res.status(400).json({ error: "Enlace inválido o caducado" });
      return;
    }

    // Check if token has expired
    if (user.passwordResetExpires && isExpired(user.passwordResetExpires)) {
      res.status(400).json({ error: "Enlace inválido o caducado" });
      return;
    }

    // Hash new password
    const hashedPassword = await bcryptjs.hash(newPassword, 10);

    // Update password and clear reset token
    user.password = hashedPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Contraseña actualizada" });
  } catch (error) {
    console.error("❌ Error in resetPassword:", error);
    res.status(500).json({ error: "Inténtalo de nuevo más tarde" });
  }
};