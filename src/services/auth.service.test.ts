import { registerUser, authenticateUser } from "./auth.service";
import { redis } from "../utils/redis";
import { hashPassword } from "../utils/security";

// Mock Redis
jest.mock("../utils/redis", () => ({
  redis: {
    exists: jest.fn(),
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
    ttl: jest.fn(),
    connect: jest.fn(),
  },
  connectRedis: jest.fn(),
  userKey: jest.fn((username: string) => `user:${username}`),
  lockKey: jest.fn((username: string) => `lock:${username}`),
  failKey: jest.fn((username: string) => `fails:${username}`),
}));

// Mock security utils
jest.mock("../utils/security", () => ({
  hashPassword: jest.fn(),
  verifyPassword: jest.fn(),
  validatePasswordStrength: jest.fn(),
}));

const mockRedis = redis as jest.Mocked<typeof redis>;
const mockHashPassword = hashPassword as jest.MockedFunction<typeof hashPassword>;

describe("Auth Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("registerUser", () => {
    const validUsername = "testuser";
    const validPassword = "TestPass123!";

    it("should successfully register a new user", async () => {
      // Mock password validation success
      const { validatePasswordStrength } = require("../utils/security");
      validatePasswordStrength.mockReturnValue({ ok: true });

      // Mock Redis operations
      mockRedis.exists.mockResolvedValue(0); // User doesn"t exist
      mockHashPassword.mockResolvedValue("hashedPassword123");
      mockRedis.set.mockResolvedValue("OK");

      const result = await registerUser(validUsername, validPassword);

      expect(result.ok).toBe(true);
      expect(result.username).toBe(validUsername.toLowerCase());
      expect(mockRedis.exists).toHaveBeenCalledWith(`user:${validUsername.toLowerCase()}`);
      expect(mockHashPassword).toHaveBeenCalledWith(validPassword);
      expect(mockRedis.set).toHaveBeenCalledWith(
        `user:${validUsername.toLowerCase()}`,
        expect.stringContaining('"username":"testuser"'),
        "NX"
      );
    });

    it("should return error if username already exists", async () => {
      const { validatePasswordStrength } = require("../utils/security");
      validatePasswordStrength.mockReturnValue({ ok: true });

      mockRedis.exists.mockResolvedValue(1); // User exists

      const result = await registerUser(validUsername, validPassword);

      expect(result.ok).toBe(false);
      expect(result.error).toBe("Username already exists");
      expect(result.details).toEqual({ username: ["This username is already taken"] });
    });

    it("should return error if password validation fails", async () => {
      const { validatePasswordStrength } = require("../utils/security");
      validatePasswordStrength.mockReturnValue({ 
        ok: false, 
        message: "Password too weak",
        details: ["Must contain uppercase letter"]
      });

      const result = await registerUser(validUsername, validPassword);

      expect(result.ok).toBe(false);
      expect(result.error).toBe("Password too weak");
      expect(result.details).toEqual(["Must contain uppercase letter"]);
    });

    it("should return error if Redis set fails", async () => {
      const { validatePasswordStrength } = require("../utils/security");
      validatePasswordStrength.mockReturnValue({ ok: true });

      mockRedis.exists.mockResolvedValue(0);
      mockHashPassword.mockResolvedValue("hashedPassword123");
      mockRedis.set.mockResolvedValue(null); // Set failed

      const result = await registerUser(validUsername, validPassword);

      expect(result.ok).toBe(false);
      expect(result.error).toBe("Registration failed");
    });

    it("should handle Redis connection errors gracefully", async () => {
      const { validatePasswordStrength } = require("../utils/security");
      validatePasswordStrength.mockReturnValue({ ok: true });

      mockRedis.exists.mockRejectedValue(new Error("Redis connection failed"));

      const result = await registerUser(validUsername, validPassword);

      expect(result.ok).toBe(false);
      expect(result.error).toBe("Internal server error");
    });
  });

  describe("authenticateUser", () => {
    const validUsername = "testuser";
    const validPassword = "TestPass123!";
    const mockUserRecord = {
      username: "testuser",
      passwordHash: "hashedPassword123",
      createdAt: "2024-01-01T00:00:00.000Z",
      passwordVersion: 1,
      lastLogin: null,
      passwordExpiresAt: null,
      passwordExpiryWarningShown: false,
    };

    it("should successfully authenticate a valid user", async () => {
      const { verifyPassword } = require("../utils/security");
      verifyPassword.mockResolvedValue(true);

      mockRedis.ttl.mockResolvedValue(-1); // Not locked
      mockRedis.get.mockResolvedValue(JSON.stringify(mockUserRecord));
      mockRedis.del.mockResolvedValue(1);

      const result = await authenticateUser(validUsername, validPassword);

      expect(result.ok).toBe(true);
      expect(result.username).toBe(validUsername);
      expect(verifyPassword).toHaveBeenCalledWith("hashedPassword123", validPassword);
      expect(mockRedis.del).toHaveBeenCalledWith(`fails:${validUsername}`);
    });

    it("should return error if account is locked", async () => {
      mockRedis.ttl.mockResolvedValue(300); // Locked for 300 seconds

      const result = await authenticateUser(validUsername, validPassword);

      expect(result.ok).toBe(false);
      expect(result.error).toBe("Account temporarily locked");
    });

    it("should return error for non-existent user", async () => {
      mockRedis.ttl.mockResolvedValue(-1); // Not locked
      mockRedis.get.mockResolvedValue(null); // User doesn"t exist

      const result = await authenticateUser(validUsername, validPassword);

      expect(result.ok).toBe(false);
      expect(result.error).toBe("Invalid username or password");
    });

    it("should return error for invalid password", async () => {
      const { verifyPassword } = require("../utils/security");
      verifyPassword.mockResolvedValue(false);

      mockRedis.ttl.mockResolvedValue(-1);
      mockRedis.get.mockResolvedValue(JSON.stringify(mockUserRecord));

      const result = await authenticateUser(validUsername, validPassword);

      expect(result.ok).toBe(false);
      expect(result.error).toBe("Invalid username or password");
    });

    it("should handle Redis errors gracefully", async () => {
      mockRedis.ttl.mockRejectedValue(new Error("Redis error"));

      const result = await authenticateUser(validUsername, validPassword);

      expect(result.ok).toBe(false);
      expect(result.error).toBe("Internal server error");
    });
  });
});
