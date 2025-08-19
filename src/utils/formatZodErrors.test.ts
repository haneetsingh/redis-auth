import { formatZodError } from "./formatZodErrors";
import { z } from "zod";

describe("formatZodError", () => {
  it("should format single field error correctly", () => {
    const schema = z.object({
      username: z.string().min(1, "Username is required"),
    });

    const result = schema.safeParse({ username: "" });
    
    if (!result.success) {
      const formatted = formatZodError(result.error);
      expect(formatted).toEqual({
        username: "Username is required"
      });
    }
  });

  it("should format multiple field errors correctly", () => {
    const schema = z.object({
      username: z.string().min(1, "Username is required"),
      password: z.string().min(6, "Password too short"),
    });

    const result = schema.safeParse({ username: "", password: "123" });
    
    if (!result.success) {
      const formatted = formatZodError(result.error);
      expect(formatted).toEqual({
        username: "Username is required",
        password: "Password too short"
      });
    }
  });

  it("should handle nested object errors", () => {
    const schema = z.object({
      user: z.object({
        profile: z.object({
          name: z.string().min(1, "Name is required")
        })
      })
    });

    const result = schema.safeParse({ user: { profile: { name: "" } } });
    
    if (!result.success) {
      const formatted = formatZodError(result.error);
      expect(formatted).toEqual({
        "user.profile.name": "Name is required"
      });
    }
  });

  it("should handle array errors", () => {
    const schema = z.object({
      tags: z.array(z.string()).min(1, "At least one tag is required")
    });

    const result = schema.safeParse({ tags: [] });
    
    if (!result.success) {
      const formatted = formatZodError(result.error);
      expect(formatted).toEqual({
        tags: "At least one tag is required"
      });
    }
  });

  it("should handle union type errors", () => {
    const schema = z.object({
      type: z.union([
        z.literal("admin"),
        z.literal("user")
      ])
    });

    const result = schema.safeParse({ type: "invalid" });
    
    if (!result.success) {
      const formatted = formatZodError(result.error);
      expect(formatted).toEqual({
        type: "Invalid input"
      });
    }
  });

  it("should handle custom error messages", () => {
    const schema = z.object({
      email: z.string().email("Invalid email format")
    });

    const result = schema.safeParse({ email: "not-an-email" });
    
    if (!result.success) {
      const formatted = formatZodError(result.error);
      expect(formatted).toEqual({
        email: "Invalid email format"
      });
    }
  });

  it("should handle complex nested errors", () => {
    const schema = z.object({
      users: z.array(z.object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email("Invalid email")
      })).min(1, "At least one user is required")
    });

    const result = schema.safeParse({
      users: [
        { name: "", email: "invalid-email" },
        { name: "John", email: "john@example.com" }
      ]
    });
    
    if (!result.success) {
      const formatted = formatZodError(result.error);
      expect(formatted).toEqual({
        "users.0.name": "Name is required",
        "users.0.email": "Invalid email"
      });
    }
  });
});
