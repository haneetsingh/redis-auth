import { hashPassword, verifyPassword, validatePasswordStrength } from "./security";
import owasp from "owasp-password-strength-test";

// Mock OWASP
jest.mock("owasp-password-strength-test", () => ({
  test: jest.fn(),
  config: jest.fn(),
}));

// Mock the password schema
jest.mock("../scehma/auth.schema", () => ({
  passwordSchema: {
    safeParse: jest.fn()
  }
}));

const mockOwasp = owasp as jest.Mocked<typeof owasp>;

describe("Security Utils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("hashPassword", () => {
    it("should hash a password successfully", async () => {
      const password = "TestPassword123!";
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe("string");
      expect(hash.length).toBeGreaterThan(0);
      expect(hash).not.toBe(password);
    });

    it("should generate different hashes for the same password", async () => {
      const password = "TestPassword123!";
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });

    it("should handle empty password", async () => {
      const hash = await hashPassword("");
      expect(hash).toBeDefined();
      expect(typeof hash).toBe("string");
    });
  });

  describe("verifyPassword", () => {
    it("should verify a correct password", async () => {
      const password = "TestPassword123!";
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(hash, password);
      expect(isValid).toBe(true);
    });

    it("should reject incorrect password", async () => {
      const password = "TestPassword123!";
      const wrongPassword = "WrongPassword123!";
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(hash, wrongPassword);
      expect(isValid).toBe(false);
    });

    it("should handle empty password", async () => {
      const password = "";
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(hash, password);
      expect(isValid).toBe(true);
    });

    it("should reject empty password against non-empty hash", async () => {
      const password = "TestPassword123!";
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(hash, "");
      expect(isValid).toBe(false);
    });
  });

  describe("validatePasswordStrength", () => {
    it("should pass strong passwords", () => {
      const { passwordSchema } = require("../scehma/auth.schema");
      passwordSchema.safeParse.mockReturnValue({ success: true });

      const strongPasswords = [
        "TestPass123!",
        "MySecureP@ssw0rd",
        "Complex#Password1",
        "Str0ng!P@ss"
      ];

      strongPasswords.forEach(password => {
        mockOwasp.test.mockReturnValue({
          strong: true,
          errors: [],
          failedTests: [],
          passedTests: [],
          isPassphrase: false,
          optionalTestsPassed: 0,
          requiredTestErrors: [],
          optionalTestErrors: []
        });

        const result = validatePasswordStrength(password);
        expect(result.ok).toBe(true);
        expect(mockOwasp.test).toHaveBeenCalledWith(password);
      });
    });

    it("should reject weak passwords", () => {
      const { passwordSchema } = require("../scehma/auth.schema");
      passwordSchema.safeParse.mockReturnValue({ success: true });

      const weakPassword = "weak";
      
      mockOwasp.test.mockReturnValue({
        strong: false,
        errors: ["Password is too short"],
        failedTests: [],
        passedTests: [],
        isPassphrase: false,
        optionalTestsPassed: 0,
        requiredTestErrors: ["Password is too short"],
        optionalTestErrors: ["Password is too common"]
      });

      const result = validatePasswordStrength(weakPassword);
      expect(result.ok).toBe(false);
      expect(result.message).toBe("Password is too short; Password is too common");
      expect(result.details).toContain("Password is too short");
      expect(result.details).toContain("Password is too common");
    });

    it("should handle OWASP test errors", () => {
      const { passwordSchema } = require("../scehma/auth.schema");
      passwordSchema.safeParse.mockReturnValue({ success: true });

      const password = "test";
      
      mockOwasp.test.mockImplementation(() => {
        throw new Error("OWASP test failed");
      });

      // The function doesn"t have error handling, so it should throw
      expect(() => validatePasswordStrength(password)).toThrow("OWASP test failed");
    });

    it("should handle passwords with only required test errors", () => {
      const { passwordSchema } = require("../scehma/auth.schema");
      passwordSchema.safeParse.mockReturnValue({ success: true });

      const password = "test";
      
      mockOwasp.test.mockReturnValue({
        strong: false,
        errors: ["Password is too short"],
        failedTests: [],
        passedTests: [],
        isPassphrase: false,
        optionalTestsPassed: 0,
        requiredTestErrors: ["Password is too short"],
        optionalTestErrors: []
      });

      const result = validatePasswordStrength(password);
      expect(result.ok).toBe(false);
      expect(result.message).toBe("Password is too short");
      expect(result.details).toEqual(["Password is too short"]);
    });

    it("should handle passwords with only optional test errors", () => {
      const { passwordSchema } = require("../scehma/auth.schema");
      passwordSchema.safeParse.mockReturnValue({ success: true });

      const password = "test";
      
      mockOwasp.test.mockReturnValue({
        strong: false,
        errors: ["Password is too common"],
        failedTests: [],
        passedTests: [],
        isPassphrase: false,
        optionalTestsPassed: 0,
        requiredTestErrors: [],
        optionalTestErrors: ["Password is too common"]
      });

      const result = validatePasswordStrength(password);
      expect(result.ok).toBe(false);
      expect(result.message).toBe("Password is too common");
      expect(result.details).toEqual(["Password is too common"]);
    });

    it("should reject passwords that fail schema validation", () => {
      const { passwordSchema } = require("../scehma/auth.schema");
      passwordSchema.safeParse.mockReturnValue({ 
        success: false, 
        error: { issues: [{ path: ["password"], message: "Password must be at least 6 characters" }] }
      });

      const result = validatePasswordStrength("weak");
      expect(result.ok).toBe(false);
      expect(result.message).toEqual({ password: "Password must be at least 6 characters" });
    });
  });
});
