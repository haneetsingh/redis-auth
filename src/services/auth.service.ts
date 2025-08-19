import { UserRecord } from "../models/user.model";
import { AUTH_LOCK_SECONDS, AUTH_MAX_FAILS } from "../utils/config";
import { connectRedis, failKey, lockKey, redis, userKey } from "../utils/redis"
import { hashPassword, validatePasswordStrength, verifyPassword } from "../utils/security";

/**
 * Register a user.
 * If the username already exists, return an error.
 */
export async function registerUser(username: string, password: string) {
  try {
    await connectRedis();

    const strength = validatePasswordStrength(password);
    if (!strength.ok) {
      return {
        ok: false,
        error: strength.message,
        details: strength.details,
      };
    }

    const key = userKey(username.toLowerCase());
    const exists = await redis.exists(key);
    if (exists) {
      return {
        ok: false,
        error: "Username already exists",
        details: { username: ["This username is already taken"] },
      };
    }

    const pwHash = await hashPassword(password);
    const userRecord: UserRecord = {
      username: username.toLowerCase().trim(),
      passwordHash: pwHash,
      createdAt: new Date().toISOString(),
      passwordVersion: 1,
      lastLogin: null,
    };

    const setOk = await redis.set(key, JSON.stringify(userRecord), "NX");
    if (setOk !== "OK") {
      return {
        ok: false,
        error: "Registration failed",
        details: { general: ["Please try again"] },
      };
    }

    return { ok: true, username: userRecord.username };
  } catch (error) {
    console.error("Registration error:", error);
    return {
      ok: false,
      error: "Internal server error",
      details: { general: ["Please try again later"] },
    };
  }
}

/**
 * Authenticate a user.
 * If the user has failed too many times, lock the account.
 */
export async function authenticateUser(username: string, password: string) {
  try {
    await connectRedis();

    const lKey = lockKey(username);
    const isLocked = await redis.ttl(lKey);
    if (isLocked && isLocked > 0) return { ok: false, error: "Account temporarily locked" };

    const uKey = userKey(username);
    const raw = await redis.get(uKey);
    if (!raw) {
      await registerFailure(username);
      return { ok: false, error: "Invalid username or password" };
    }

    const user: UserRecord = JSON.parse(raw);
    const valid = await verifyPassword(user.passwordHash, password);
    if (!valid) {
      await registerFailure(username);
      return { ok: false, error: "Invalid username or password" };
    }

    await redis.del(failKey(username));
    return { ok: true, username };
  } catch (error) {
    console.error("Authentication error:", error);
    return { ok: false, error: "Internal server error" };
  }
}

// Register a failed authentication attempt for a user
async function registerFailure(username: string) {
  const fKey = failKey(username);
  const fails = await redis.incr(fKey);
  if (fails === 1) await redis.expire(fKey, AUTH_LOCK_SECONDS);
  if (fails >= AUTH_MAX_FAILS) await redis.set(lockKey(username), "1", "EX", AUTH_LOCK_SECONDS);
}
