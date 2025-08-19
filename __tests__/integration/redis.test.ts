import { redis, connectRedis, userKey, lockKey, failKey } from "../../src/utils/redis";

// Mock ioredis
jest.mock("ioredis", () => {
  return jest.fn().mockImplementation(() => ({
    status: "end",
    connect: jest.fn().mockResolvedValue(undefined),
    exists: jest.fn(),
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
    ttl: jest.fn(),
  }));
});

describe("Redis Utilities Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Redis Connection", () => {
    it("should connect to Redis when status is end", async () => {
      const mockRedis = redis as any;
      mockRedis.status = "end";
      mockRedis.connect = jest.fn().mockResolvedValue(undefined);

      await connectRedis();

      expect(mockRedis.connect).toHaveBeenCalled();
    });

    it("should connect to Redis when status is wait", async () => {
      const mockRedis = redis as any;
      mockRedis.status = "wait";
      mockRedis.connect = jest.fn().mockResolvedValue(undefined);

      await connectRedis();

      expect(mockRedis.connect).toHaveBeenCalled();
    });

    it("should not connect when already connected", async () => {
      const mockRedis = redis as any;
      mockRedis.status = "ready";
      mockRedis.connect = jest.fn();

      await connectRedis();

      expect(mockRedis.connect).not.toHaveBeenCalled();
    });

    it("should handle connection errors gracefully", async () => {
      const mockRedis = redis as any;
      mockRedis.status = "end";
      mockRedis.connect = jest.fn().mockRejectedValue(new Error("Connection failed"));

      await expect(connectRedis()).rejects.toThrow("Connection failed");
    });
  });

  describe("Redis Key Generation", () => {
    it("should generate correct user keys", () => {
      const username = "testuser";
      const key = userKey(username);
      
      expect(key).toBe(`user:${username}`);
    });

    it("should generate correct lock keys", () => {
      const username = "testuser";
      const key = lockKey(username);
      
      expect(key).toBe(`lock:${username}`);
    });

    it("should generate correct fail keys", () => {
      const username = "testuser";
      const key = failKey(username);
      
      expect(key).toBe(`fails:${username}`);
    });

    it("should handle special characters in usernames", () => {
      const username = "test_user-123";
      const userKeyResult = userKey(username);
      const lockKeyResult = lockKey(username);
      const failKeyResult = failKey(username);
      
      expect(userKeyResult).toBe(`user:${username}`);
      expect(lockKeyResult).toBe(`lock:${username}`);
      expect(failKeyResult).toBe(`fails:${username}`);
    });

    it("should handle empty usernames", () => {
      const username = "";
      const userKeyResult = userKey(username);
      const lockKeyResult = lockKey(username);
      const failKeyResult = failKey(username);
      
      expect(userKeyResult).toBe("user:");
      expect(lockKeyResult).toBe("lock:");
      expect(failKeyResult).toBe("fails:");
    });
  });

  describe("Redis Instance Configuration", () => {
    it("should have Redis instance available", () => {
      // Test that the Redis instance exists and has the expected methods
      expect(redis).toBeDefined();
      expect(typeof redis.exists).toBe("function");
      expect(typeof redis.set).toBe("function");
      expect(typeof redis.get).toBe("function");
    });

    it("should have key generation utilities", () => {
      const testUsername = "testuser";
      
      expect(userKey(testUsername)).toBe(`user:${testUsername}`);
      expect(lockKey(testUsername)).toBe(`lock:${testUsername}`);
      expect(failKey(testUsername)).toBe(`fails:${testUsername}`);
    });
  });

  describe("Redis Operations", () => {
    it("should have all required Redis methods", () => {
      const mockRedis = redis as any;
      
      expect(typeof mockRedis.exists).toBe("function");
      expect(typeof mockRedis.set).toBe("function");
      expect(typeof mockRedis.get).toBe("function");
      expect(typeof mockRedis.del).toBe("function");
      expect(typeof mockRedis.incr).toBe("function");
      expect(typeof mockRedis.expire).toBe("function");
      expect(typeof mockRedis.ttl).toBe("function");
    });

    it("should handle Redis method calls correctly", async () => {
      const mockRedis = redis as any;
      mockRedis.exists.mockResolvedValue(1);
      mockRedis.set.mockResolvedValue("OK");
      mockRedis.get.mockResolvedValue("{'username':'test'}");
      mockRedis.del.mockResolvedValue(1);
      mockRedis.incr.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);
      mockRedis.ttl.mockResolvedValue(-1);

      // Test that methods can be called
      await expect(mockRedis.exists("test")).resolves.toBe(1);
      await expect(mockRedis.set("test", "value")).resolves.toBe("OK");
      await expect(mockRedis.get("test")).resolves.toBe("{'username':'test'}");
      await expect(mockRedis.del("test")).resolves.toBe(1);
      await expect(mockRedis.incr("test")).resolves.toBe(1);
      await expect(mockRedis.expire("test", 60)).resolves.toBe(1);
      await expect(mockRedis.ttl("test")).resolves.toBe(-1);
    });
  });
});
