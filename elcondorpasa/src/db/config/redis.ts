import Redis from "ioredis";

// Get the Redis URL
const redisUrl = process.env.REDIS_HOST;

// Create Redis instance
export const redis = redisUrl ? new Redis(redisUrl) : new Redis();
