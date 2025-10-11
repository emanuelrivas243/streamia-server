import { z } from "zod";

/**
 * Validation schemas using Zod for user operations.
 */

/**
 * Schema for user registration validation.
 * - firstName, lastName: non-empty strings
 * - age: number >= 13
 * - email: valid RFC 5322 format
 * - password: >= 8 chars, at least 1 uppercase, 1 lowercase, 1 number, 1 special char
 * - confirmPassword: must match password
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
 * Schema for login validation.
 */
export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

/**
 * Schema for forgot password.
 */
export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
});

/**
 * Schema for reset password.
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
 * Schema for update profile.
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
 * Type exports for TypeScript usage
 */
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;