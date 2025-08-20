import { usernameSchema, passwordSchema } from "./auth.schema";

describe("Auth Schema Validation", () => {
  describe("usernameSchema", () => {
    it("should validate a valid username", () => {
      const validUsernames = [
        "user123",
        "test_user",
        "myUsername",
        "test.user",
        "test-user",
        "verylongusernamewithmanychar"
      ];

      validUsernames.forEach(username => {
        const result = usernameSchema.safeParse(username);

        expect(result.success).toBe(true);
        expect(result.data).toBe(username);
      });
    });

    it("should reject usernames that are too short", () => {
      const shortUsernames = ["", "a", "ab"];

      shortUsernames.forEach(username => {
        const result = usernameSchema.safeParse(username);
        expect(result.success).toBe(false);
        if (!result.success) {
          const expectedMessage = username === "" ? "Username is required" : "Username must be at least 3 characters";
          expect(result.error.issues[0].message).toBe(expectedMessage);
        }
      });
    });

    it("should reject usernames that are too long", () => {
      const longUsername = "a".repeat(33);
      const result = usernameSchema.safeParse(longUsername);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Username cannot exceed 32 characters");
      }
    });

    it("should reject usernames with invalid characters", () => {
      const invalidUsernames = [
        "user@name",
        "user name",
        "user/name",
        "user\\name",
        "user*name"
      ];

      invalidUsernames.forEach(username => {
        const result = usernameSchema.safeParse(username);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Username may contain only letters, numbers, dots, underscores, and hyphens");
        }
      });
    });

    it("should reject usernames starting with dots", () => {
      const result = usernameSchema.safeParse(".testuser");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Username cannot start or end with a dot");
      }
    });

    it("should reject usernames ending with dots", () => {
      const result = usernameSchema.safeParse("testuser.");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Username cannot start or end with a dot");
      }
    });

    it("should reject usernames with consecutive dots", () => {
      const result = usernameSchema.safeParse("test..user");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Username cannot contain consecutive dots");
      }
    });

    it("should allow usernames starting with numbers", () => {
      const result = usernameSchema.safeParse("123user");
      expect(result.success).toBe(true);
    });
  });

  describe("passwordSchema", () => {
    it("should validate a strong password", () => {
      const strongPasswords = [
        "TestPass123!",
        "MySecureP@ssw0rd",
        "Complex#Password1",
        "Str0ng!P@ss"
      ];

      strongPasswords.forEach(password => {
        const result = passwordSchema.safeParse(password);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe(password);
        }
      });
    });

    it("should reject passwords that are too short", () => {
      const shortPasswords = ["", "123", "abc", "Test1", "1234567"];

      shortPasswords.forEach(password => {
        const result = passwordSchema.safeParse(password);
        expect(result.success).toBe(false);
        if (!result.success) {
          const expectedMessage = password === "" ? "Password is required" : "Password must be at least 8 characters";
          expect(result.error.issues[0].message).toBe(expectedMessage);
        }
      });
    });

    it("should accept passwords without complexity requirements (handled by OWASP)", () => {
      const passwords = ["TEST1234!", "test1234!", "TestPass!", "TestPass123"];

      passwords.forEach(password => {
        const result = passwordSchema.safeParse(password);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe(password);
        }
      });
    });

    it("should accept passwords with spaces (OWASP handles space validation)", () => {
      const result = passwordSchema.safeParse("Test Pass 123!");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("Test Pass 123!");
      }
    });

    it("should reject passwords that exceed maximum length", () => {
      const longPassword = "a".repeat(129);
      const result = passwordSchema.safeParse(longPassword);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Password cannot exceed 128 characters");
      }
    });

    it("should handle preprocessing correctly", () => {
      const result = passwordSchema.safeParse(undefined);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Password is required");
      }
    });
  });
});
