import Redis from "ioredis";
import { REDIS_URL } from "./config";

export const redis = new Redis(REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 2
});

export async function connectRedis(): Promise<Redis> {
  // If the connection is not established, connect to Redis
  if (redis.status === "end" || redis.status === "wait") {
    await redis.connect();
  }

  return redis;
}

export const userKey = (username: string) => `user:${username}`;
export const lockKey = (username: string) => `lock:${username}`;
export const failKey = (username: string) => `fails:${username}`;
