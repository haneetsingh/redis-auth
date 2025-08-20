import request from "supertest";
import express from "express";
import authRoutes from "../../src/routes/auth.routes";

// Mock the auth service
jest.mock("../../src/services/auth.service", () => ({
  registerUser: jest.fn(),
  authenticateUser: jest.fn(),
}));

// Mock rate limiter middleware
jest.mock("../../src/middleware/rate-limiter.middleware", () => ({
  rateLimiterMiddleware: (req: any, res: any, next: any) => next(),
}));

const { registerUser, authenticateUser } = require("../../src/services/auth.service");

const app = express();
app.use(express.json());
app.use("/v1/auth", authRoutes);

describe("Auth Routes Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /v1/auth/register", () => {
    const validUser = {
      username: "testuser",
      password: "TestPass123!"
    };

    it("should register a new user successfully", async () => {
      registerUser.mockResolvedValue({
        ok: true,
        username: "testuser"
      });

      const response = await request(app)
        .post("/v1/auth/register")
        .send(validUser)
        .expect(201);

      expect(response.body).toEqual({
        ok: true,
        username: "testuser",
        message: "User registered successfully"
      });

      expect(registerUser).toHaveBeenCalledWith("testuser", "TestPass123!");
    });

    it("should return 409 when username already exists", async () => {
      registerUser.mockResolvedValue({
        ok: false,
        error: "Username already exists",
        details: { username: ["This username is already taken"] }
      });

      const response = await request(app)
        .post("/v1/auth/register")
        .send(validUser)
        .expect(409);

      expect(response.body).toEqual({
        ok: false,
        error: "Username already exists",
        details: { username: ["This username is already taken"] }
      });
    });

    it("should return 400 for invalid username", async () => {
      const invalidUser = {
        username: "", // Empty username
        password: "TestPass123!"
      };

      const response = await request(app)
        .post("/v1/auth/register")
        .send(invalidUser)
        .expect(400);

      expect(response.body.error).toBe("Invalid request");
      expect(response.body.details).toBeDefined();
    });

    it("should return 400 for invalid password", async () => {
      const invalidUser = {
        username: "testuser",
        password: "weak" // Weak password
      };

      const response = await request(app)
        .post("/v1/auth/register")
        .send(invalidUser)
        .expect(400);

      expect(response.body.error).toBe("Invalid request");
      expect(response.body.details).toBeDefined();
    });

    it("should return 400 for missing fields", async () => {
      const incompleteUser = {
        username: "testuser"
        // Missing password
      };

      const response = await request(app)
        .post("/v1/auth/register")
        .send(incompleteUser)
        .expect(400);

      expect(response.body.error).toBe("Invalid request");
      expect(response.body.details).toBeDefined();
    });

    it("should return 400 for extra fields", async () => {
      const extraFieldsUser = {
        username: "testuser",
        password: "TestPass123!",
        email: "test@example.com" // Extra field
      };

      const response = await request(app)
        .post("/v1/auth/register")
        .send(extraFieldsUser)
        .expect(400);

      expect(response.body.error).toBe("Invalid request");
      expect(response.body.details).toBeDefined();
    });

    it("should convert username to lowercase", async () => {
      const userWithUppercase = {
        username: "TestUser",
        password: "TestPass123!"
      };

      registerUser.mockResolvedValue({
        ok: true,
        username: "testuser"
      });

      await request(app)
        .post("/v1/auth/register")
        .send(userWithUppercase)
        .expect(201);

      expect(registerUser).toHaveBeenCalledWith("testuser", "TestPass123!");
    });
  });

  describe("POST /v1/auth/login", () => {
    const validCredentials = {
      username: "testuser",
      password: "TestPass123!"
    };

    it("should authenticate user successfully", async () => {
      authenticateUser.mockResolvedValue({
        ok: true,
        username: "testuser"
      });

      const response = await request(app)
        .post("/v1/auth/login")
        .send(validCredentials)
        .expect(200);

      expect(response.body).toEqual({
        ok: true,
        authenticated: true,
        username: "testuser"
      });

      expect(authenticateUser).toHaveBeenCalledWith("testuser", "TestPass123!");
    });

    it("should return 401 for invalid credentials", async () => {
      authenticateUser.mockResolvedValue({
        ok: false,
        error: "Invalid username or password"
      });

      const response = await request(app)
        .post("/v1/auth/login")
        .send(validCredentials)
        .expect(401);

      expect(response.body).toEqual({
        ok: false,
        error: "Invalid username or password"
      });
    });

    it("should return 401 for locked account", async () => {
      authenticateUser.mockResolvedValue({
        ok: false,
        error: "Account temporarily locked"
      });

      const response = await request(app)
        .post("/v1/auth/login")
        .send(validCredentials)
        .expect(401);

      expect(response.body).toEqual({
        ok: false,
        error: "Account temporarily locked"
      });
    });

    it("should return 401 for invalid input", async () => {
      const invalidCredentials = {
        username: "", // Empty username
        password: "TestPass123!"
      };

      const response = await request(app)
        .post("/v1/auth/login")
        .send(invalidCredentials)
        .expect(401);

      expect(response.body).toEqual({
        ok: false,
        error: "Invalid username or password"
      });
    });

    it("should convert username to lowercase", async () => {
      const credentialsWithUppercase = {
        username: "TestUser",
        password: "TestPass123!"
      };

      authenticateUser.mockResolvedValue({
        ok: true,
        username: "testuser"
      });

      await request(app)
        .post("/v1/auth/login")
        .send(credentialsWithUppercase)
        .expect(200);

      expect(authenticateUser).toHaveBeenCalledWith("testuser", "TestPass123!");
    });
  });

  describe("Input Validation", () => {
    it("should handle malformed JSON", async () => {
      const response = await request(app)
        .post("/v1/auth/register")
        .set("Content-Type", "application/json")
        .send("{'username': 'testuser', 'password': 'TestPass123!'") // Malformed JSON
        .expect(400);

      // Express returns different error structure for JSON parsing errors
      expect(response.body.message || response.body.error || response.text).toBeDefined();
    });

    it("should handle non-JSON content type", async () => {
      const response = await request(app)
        .post("/v1/auth/register")
        .set("Content-Type", "text/plain")
        .send("username=testuser&password=TestPass123!")
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });
});
