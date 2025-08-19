import { z } from "zod";

// Username schema
export const usernameSchema = z.preprocess(
  (val) => (typeof val === "string" ? val.trim() : ""),
  z.string()
    .min(1, "Username is required")
    .min(3, "Username must be at least 3 characters")
    .max(32, "Username cannot exceed 32 characters")
    .regex(/^[a-zA-Z0-9._-]+$/, "Username may contain only letters, numbers, dots, underscores, and hyphens")
    .refine((val) => !val.startsWith(".") && !val.endsWith("."), {
      message: "Username cannot start or end with a dot"
    })
    .refine((val) => !val.includes(".."), {
      message: "Username cannot contain consecutive dots"
    })
);

// Password schema
export const passwordSchema = z.preprocess(
  (val) => (typeof val === "string" ? val : ""),
  z.string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character")
    .refine((password) => !password.includes(" "), {
      message: "Password cannot contain spaces"
    })
);
