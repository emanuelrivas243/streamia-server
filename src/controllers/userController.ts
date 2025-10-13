import bcryptjs from "bcryptjs";
import { Request, Response } from "express";
import { User } from "../models/User";
import { sendPasswordResetEmail, sendWelcomeEmail } from "../utils/emailService";
import { generateResetToken, generateToken, getResetTokenExpiration, hashResetToken, isExpired } from "../utils/helpers";
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema, updateProfileSchema } from "../utils/validators";
import crypto from "crypto";
import { sendMail } from "../utils/mailer"; // <-- asegúrate de este import


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
      res.status(400).json({ error: "Error de validación", details: validation.error.flatten() });
      return;
    }

    const { firstName, lastName, age, email, password } = validation.data;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409).json({ error: "Este correo ya está registrado." });
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
      console.error("Error al enviar el correo electrónico de bienvenida:", err)
    );

    res.status(201).json({
      message: "Cuenta creada con éxito.",
      user: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error("❌ Error en registerUser:", error);
    res.status(500).json({ error: "Inténtalo de nuevo más tarde." });
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
      res.status(400).json({ error: "Error de validación", details: validation.error.flatten() });
      return;
    }

    const { email, password } = validation.data;

    // Find user and include password field
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      res.status(401).json({ error: "Correo o contraseña inválidos." });
      return;
    }

    // Compare passwords
    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ error: "Correo o contraseña inválidos." });
      return;
    }

    // Generate JWT token
    const token = generateToken(user._id.toString(), user.email);

    res.status(200).json({
      message: "Inicio de sesión correcto!",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("❌ Error en loginUser:", error);
    res.status(500).json({ error: "Inténtalo de nuevo más tarde" });
  }
};

/**
 * Logout user (frontend removes token).
 * POST /api/users/logout
 */
export const logoutUser = async (req: Request, res: Response): Promise<void> => {
  try {
    res.status(200).json({ message: "Sesión cerrada correctamente." });
  } catch (error) {
    console.error("❌ Error en logoutUser:", error);
    res.status(500).json({ error: "Inténtalo de nuevo más tarde." });
  }
};

/**
 * Get user profile (requires authentication).
 * GET /api/users/me
 */
export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: "No autorizado" });
      return;
    }

    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ error: "Usuario no encontrado." });
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
    console.error("❌ Error en getUserProfile:", error);
    res.status(500).json({ error: "No pudimos obtener tu perfil." });
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
      res.status(401).json({ error: "No autorizado" });
      return;
    }

    // Validate input
    const validation = updateProfileSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: "Error de validación", details: validation.error.flatten() });
      return;
    }

    const { firstName, lastName, age, email } = validation.data;

    // Check if new email is already in use (if provided)
    if (email) {
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser._id.toString() !== req.userId) {
        res.status(409).json({ error: "Este correo ya está registrado." });
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
      res.status(404).json({ error: "Usuario no encontrado." });
      return;
    }

    res.status(200).json({
      message: "Perfil actualizado.",
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
    console.error("❌ Error en updateUserProfile:", error);
    res.status(500).json({ error: "Inténtalo de nuevo más tarde." });
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
      res.status(401).json({ error: "No Autorizado" });
      return;
    }

    const { password } = req.body;

    if (!password) {
      res.status(400).json({ error: "Se requiere contraseña." });
      return;
    }

    // Find user with password field
    const user = await User.findById(req.userId).select("+password");
    if (!user) {
      res.status(404).json({ error: "Usuario no encontrado." });
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
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      res.status(400).json({ error: "No existe un usuario con este correo" });
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
        <h2>Restablecimiento de contraseña</h2>
        <p>Hola ${user.firstName},</p>
        <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace:</p>
        <a href="${resetURL}" target="_blank" style="color: #007bff;">
          ${resetURL}
        </a>
        <p>Si no solicitaste este cambio, ignora este mensaje.</p>
      </div>
    `;

    await sendMail(
      user.email,
      "Restablece tu contraseña",
      htmlContent
    );

    res.status(200).json({ message: "Correo enviado para restablecer la contraseña" });
  } catch (error) {
    console.error("Error en forgotPassword:", error);
    res.status(500).json({ error: "Error al procesar la solicitud" });
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

    // Hashear token recibido
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Buscar usuario con token válido
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    }).select("+passwordResetToken +passwordResetExpires +password");

    if (!user) {
      res.status(400).json({ error: "Token inválido o expirado" });
      return;
    }

    // Actualizar contraseña
    user.password = await bcryptjs.hash(newPassword, 10);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Contraseña actualizada con éxito" });
  } catch (error) {
    console.error("Error en resetPassword:", error);
    res.status(500).json({ error: "Error al restablecer la contraseña" });
  }
};
