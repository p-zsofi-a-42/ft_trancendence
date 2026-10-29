// services/user/server/utils/redis.ts
import { createClient } from 'redis'

export const redisPub = createClient({ url: process.env.REDIS_URL })
export const redisPubReady = redisPub.connect()