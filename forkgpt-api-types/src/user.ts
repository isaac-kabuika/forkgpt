import { z } from "zod";

// Base user schema
export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().optional(),
  isAnonymous: z.boolean(),
  createdAt: z.date(),
  lastLoginAt: z.date(),
});
export type User = z.infer<typeof userSchema>;

// Request/Response types
export const updateUserRequestSchema = z.object({
  email: z.string().email().optional(),
});
export type UpdateUserRequest = z.infer<typeof updateUserRequestSchema>;

export const userResponseSchema = z.object({
  user: userSchema,
});
export type UserResponse = z.infer<typeof userResponseSchema>;

export const authStatusResponseSchema = z.object({
  isAuthenticated: z.boolean(),
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email().optional(),
    isAnonymous: z.boolean(),
  }),
});
export type AuthStatusResponse = z.infer<typeof authStatusResponseSchema>;
