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
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password cannot exceed 128 characters")
);
