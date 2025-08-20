import dotenv from "dotenv";

dotenv.config();

export const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";
export const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;
export const RATE_MAX = process.env.RATE_MAX ? parseInt(process.env.RATE_MAX) : 20;
export const AUTH_MAX_FAILS = process.env.AUTH_MAX_FAILS ? parseInt(process.env.AUTH_MAX_FAILS, 10) : 5;
export const RATE_WINDOW_MS = process.env.RATE_WINDOW_MS ? parseInt(process.env.RATE_WINDOW_MS, 10) :  60000;
export const AUTH_LOCK_SECONDS = process.env.AUTH_LOCK_SECONDS ? parseInt(process.env.AUTH_LOCK_SECONDS, 10) : 900;

/*
* TODO: Password expiry configuration
* export const PASSWORD_EXPIRY_DAYS = process.env.PASSWORD_EXPIRY_DAYS ? parseInt(process.env.PASSWORD_EXPIRY_DAYS, 10) : 180; // 6 months
* export const PASSWORD_WARNING_DAYS = process.env.PASSWORD_WARNING_DAYS ? parseInt(process.env.PASSWORD_WARNING_DAYS, 10) : 14; // 2 weeks warning
*/
