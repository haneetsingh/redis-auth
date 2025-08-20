import request from "supertest";
import express from "express";
import { redis } from "../../src/utils/redis";
import { hashPassword, verifyPassword } from "../../src/utils/security";
import authRoutes from "../../src/routes/auth.routes";

// Mock Redis
jest.mock("../../src/utils/redis", () => ({
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
  connectRedis: jest.fn().mockResolvedValue(undefined),
  userKey: jest.fn((username: string) => `user:${username}`),
  lockKey: jest.fn((username: string) => `lock:${username}`),
  failKey: jest.fn((username: string) => `fails:${username}`),
}));

// Mock security utils
jest.mock("../../src/utils/security", () => ({
  hashPassword: jest.fn(),
  verifyPassword: jest.fn(),
  validatePasswordStrength: jest.fn(),
}));

const mockRedis = redis as jest.Mocked<typeof redis>;
const mockHashPassword = hashPassword as jest.MockedFunction<typeof hashPassword>;
const mockVerifyPassword = verifyPassword as jest.MockedFunction<typeof verifyPassword>;

const app = express();
app.use(express.json());
app.use("/v1/auth", authRoutes);

describe("End-to-End Authentication Flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Complete User Registration and Login Flow", () => {
    const testUser = {
      username: "endtoenduser",
      password: "EndToEndPass123!"
    };

    it("should complete full registration and login flow", async () => {
      // Mock password validation success
      const { validatePasswordStrength } = require("../../src/utils/security");
      validatePasswordStrength.mockReturnValue({ ok: true });

      // Mock Redis operations for registration
      mockRedis.exists.mockResolvedValue(0); // User doesn"t exist
      mockHashPassword.mockResolvedValue("hashedPassword123");
      mockRedis.set.mockResolvedValue("OK");

      // Step 1: Register user
      const registerResponse = await request(app)
        .post("/v1/auth/register")
        .send(testUser)
        .expect(201);

      expect(registerResponse.body).toEqual({
        ok: true,
        username: "endtoenduser",
        message: "User registered successfully"
      });

      // Verify Redis was called correctly
      expect(mockRedis.exists).toHaveBeenCalledWith("user:endtoenduser");
      expect(mockHashPassword).toHaveBeenCalledWith("EndToEndPass123!");
      expect(mockRedis.set).toHaveBeenCalledWith(
        "user:endtoenduser",
        expect.stringContaining('"username":"endtoenduser"'),
        "NX"
      );

      // Mock Redis operations for login
      const mockUserRecord = {
        username: "endtoenduser",
        passwordHash: "hashedPassword123",
        createdAt: "2024-01-01T00:00:00.000Z",
        passwordVersion: 1,
        lastLogin: null,
        passwordExpiresAt: null,
        passwordExpiryWarningShown: false,
      };

      mockRedis.ttl.mockResolvedValue(-1); // Not locked
      mockRedis.get.mockResolvedValue(JSON.stringify(mockUserRecord));
      mockRedis.del.mockResolvedValue(1);
      mockVerifyPassword.mockResolvedValue(true);

      // Step 2: Login with registered user
      const loginResponse = await request(app)
        .post("/v1/auth/login")
        .send(testUser)
        .expect(200);

      expect(loginResponse.body).toEqual({
        ok: true,
        authenticated: true,
        username: "endtoenduser"
      });

      // Verify Redis was called correctly for login
      expect(mockRedis.ttl).toHaveBeenCalledWith("lock:endtoenduser");
      expect(mockRedis.get).toHaveBeenCalledWith("user:endtoenduser");
      expect(mockVerifyPassword).toHaveBeenCalledWith("hashedPassword123", "EndToEndPass123!");
      expect(mockRedis.del).toHaveBeenCalledWith("fails:endtoenduser");
    });

    it("should handle duplicate registration attempts", async () => {
      const { validatePasswordStrength } = require("../../src/utils/security");
      validatePasswordStrength.mockReturnValue({ ok: true });

      // First registration
      mockRedis.exists.mockResolvedValue(0);
      mockHashPassword.mockResolvedValue("hashedPassword123");
      mockRedis.set.mockResolvedValue("OK");

      await request(app)
        .post("/v1/auth/register")
        .send(testUser)
        .expect(201);

      // Second registration attempt with same username
      mockRedis.exists.mockResolvedValue(1); // User now exists

      const duplicateResponse = await request(app)
        .post("/v1/auth/register")
        .send(testUser)
        .expect(409);

      expect(duplicateResponse.body).toEqual({
        ok: false,
        error: "Username already exists",
        details: { username: ["This username is already taken"] }
      });
    });

    it("should handle failed login attempts and account lockout", async () => {
      const { validatePasswordStrength } = require("../../src/utils/security");
      validatePasswordStrength.mockReturnValue({ ok: true });

      // Register user first
      mockRedis.exists.mockResolvedValue(0);
      mockHashPassword.mockResolvedValue("hashedPassword123");
      mockRedis.set.mockResolvedValue("OK");

      await request(app)
        .post("/v1/auth/register")
        .send(testUser)
        .expect(201);

      // Mock failed login attempts
      const mockUserRecord = {
        username: "endtoenduser",
        passwordHash: "hashedPassword123",
        createdAt: "2024-01-01T00:00:00.000Z",
        passwordVersion: 1,
        lastLogin: null,
        passwordExpiresAt: null,
        passwordExpiryWarningShown: false,
      };

      // First few failed attempts
      mockRedis.ttl.mockResolvedValue(-1); // Not locked
      mockRedis.get.mockResolvedValue(JSON.stringify(mockUserRecord));
      mockVerifyPassword.mockResolvedValue(false);
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);

      // Attempt failed login
      await request(app)
        .post("/v1/auth/login")
        .send({ ...testUser, password: "WrongPassword123!" })
        .expect(401);

      // Mock account lockout after multiple failures
      mockRedis.ttl.mockResolvedValue(300); // Now locked

      const lockedResponse = await request(app)
        .post("/v1/auth/login")
        .send(testUser)
        .expect(401);

      expect(lockedResponse.body).toEqual({
        ok: false,
        error: "Account temporarily locked"
      });
    });
  });

  describe("Input Validation and Error Handling", () => {
    it("should validate all required fields", async () => {
      const invalidRequests = [
        {}, // Empty body
        { username: "testuser" }, // Missing password
        { password: "TestPass123!" }, // Missing username
        { username: "", password: "TestPass123!" }, // Empty username
        { username: "testuser", password: "" }, // Empty password
        { username: "a".repeat(33), password: "TestPass123!" }, // Username too long
        { username: "testuser", password: "weak" }, // Weak password
        { username: "user@name", password: "TestPass123!" }, // Invalid username characters
      ];

      for (const invalidRequest of invalidRequests) {
        const response = await request(app)
          .post("/v1/auth/register")
          .send(invalidRequest)
          .expect(400);

        expect(response.body.error).toBeDefined();
        expect(response.body.details).toBeDefined();
      }
    });

    it("should handle malformed requests gracefully", async () => {
      const malformedRequests = [
        "{'username': 'testuser', 'password': 'TestPass123!'", // Incomplete JSON
        "username=testuser&password=TestPass123!", // Form data
        "not json at all", // Plain text
      ];

      for (const malformedRequest of malformedRequests) {
        const response = await request(app)
          .post("/v1/auth/register")
          .set("Content-Type", "application/json")
          .send(malformedRequest)
          .expect(400);

        expect(response.body.message || response.body.error || response.text).toBeDefined();
      }
    });
  });

  describe("Username Case Handling", () => {
    it("should handle username case sensitivity correctly", async () => {
      const { validatePasswordStrength } = require("../../src/utils/security");
      validatePasswordStrength.mockReturnValue({ ok: true });

      // Register with mixed case
      mockRedis.exists.mockResolvedValue(0);
      mockHashPassword.mockResolvedValue("hashedPassword123");
      mockRedis.set.mockResolvedValue("OK");

      await request(app)
        .post("/v1/auth/register")
        .send({
          username: "TestUser",
          password: "TestPass123!"
        })
        .expect(201);

      // Login should work with different case
      const mockUserRecord = {
        username: "testuser",
        passwordHash: "hashedPassword123",
        createdAt: "2024-01-01T00:00:00.000Z",
        passwordVersion: 1,
        lastLogin: null,
        passwordExpiresAt: null,
        passwordExpiryWarningShown: false,
      };

      mockRedis.ttl.mockResolvedValue(-1);
      mockRedis.get.mockResolvedValue(JSON.stringify(mockUserRecord));
      mockRedis.del.mockResolvedValue(1);
      mockVerifyPassword.mockResolvedValue(true);

      await request(app)
        .post("/v1/auth/login")
        .send({
          username: "TESTUSER",
          password: "TestPass123!"
        })
        .expect(200);

      // Verify username was stored in lowercase
      expect(mockRedis.set).toHaveBeenCalledWith(
        "user:testuser",
        expect.stringContaining('"username":"testuser"'),
        "NX"
      );
    });
  });
});
