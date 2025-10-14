import { z } from "zod";

/**
 * Validation schemas using Zod for user operations.
 */

/**
 * Schema for validating user registration data.
 *
 * @typedef {Object} RegisterData
 * @property {string} firstName - User's first name, required, 1-50 characters.
 * @property {string} lastName - User's last name, required, 1-50 characters.
 * @property {number} age - User's age, integer >= 13.
 * @property {string} email - User's email, must be valid RFC 5322 format.
 * @property {string} password - Password, minimum 8 chars, at least 1 uppercase, 1 lowercase, 1 number, 1 special character.
 * @property {string} confirmPassword - Must match `password`.
 */

export const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(1, "First name is required")
      .max(50, "First name too long"),
    lastName: z
      .string()
      .min(1, "Last name is required")
      .max(50, "Last name too long"),
    age: z
      .number()
      .int("Age must be an integer")
      .min(13, "Age must be at least 13")
      .max(150, "Age must be realistic"),
    email: z
      .string()
      .email("Invalid email format"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
        "Password must contain at least one special character"
      ),
    confirmPassword: z.string(),
  })
  .refine(
    (data: { password: string; confirmPassword: string }) =>
      data.password === data.confirmPassword,
    {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }
  );

/**
 * Schema for validating user login data.
 *
 * @typedef {Object} LoginData
 * @property {string} email - User's email, must be valid format.
 * @property {string} password - User's password, required.
 */

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

/**
 * Schema for validating forgot password requests.
 *
 * @typedef {Object} ForgotPasswordData
 * @property {string} email - User's email, must be valid format.
 */

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
});

/**
 * Schema for validating reset password requests.
 *
 * @typedef {Object} ResetPasswordData
 * @property {string} token - Password reset token, required.
 * @property {string} newPassword - New password, minimum 8 chars, must include at least 1 uppercase, 1 lowercase, 1 number, and 1 special character.
 * @property {string} confirmPassword - Must match `newPassword`.
 */

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
        "Password must contain at least one special character"
      ),
    confirmPassword: z.string(),
  })
  .refine(
    (data: { newPassword: string; confirmPassword: string }) =>
      data.newPassword === data.confirmPassword,
    {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }
  );

/**
 * Schema for validating user profile updates.
 *
 * All fields are optional; only provided fields will be updated.
 *
 * @typedef {Object} UpdateProfileData
 * @property {string} [firstName] - User's first name, 1-50 characters.
 * @property {string} [lastName] - User's last name, 1-50 characters.
 * @property {number} [age] - User's age, integer >= 13.
 * @property {string} [email] - User's email, must be valid format.
 */

export const updateProfileSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(50, "First name too long")
    .optional(),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(50, "Last name too long")
    .optional(),
  age: z
    .number()
    .int("Age must be an integer")
    .min(13, "Age must be at least 13")
    .max(150, "Age must be realistic")
    .optional(),
  email: z.string().email("Invalid email format").optional(),
});

/**
 * Type exports for TypeScript usage.
 *
 * These types are inferred from the corresponding Zod validation schemas.
 * They ensure type safety when handling request data in your application.
 */

/** @typedef {import('zod').infer<typeof registerSchema>} RegisterInput - Input type for user registration */
export type RegisterInput = z.infer<typeof registerSchema>;

/** @typedef {import('zod').infer<typeof loginSchema>} LoginInput - Input type for user login */
export type LoginInput = z.infer<typeof loginSchema>;

/** @typedef {import('zod').infer<typeof forgotPasswordSchema>} ForgotPasswordInput - Input type for forgot password */
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

/** @typedef {import('zod').infer<typeof resetPasswordSchema>} ResetPasswordInput - Input type for reset password */
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/** @typedef {import('zod').infer<typeof updateProfileSchema>} UpdateProfileInput - Input type for updating user profile */
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
