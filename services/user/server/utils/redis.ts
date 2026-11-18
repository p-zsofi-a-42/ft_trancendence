// services/user/server/utils/redis.ts
import { createClient } from 'redis'

export const redisPub = createClient({ url: process.env.REDIS_URL })
export const redisPubReady = redisPub.connect()

export async function publishFriendsChanged(...userIds: number[]) {
  try {
    await redisPubReady
    await Promise.all(userIds.map(id => redisPub.publish(`friends:changed:${id}`, '{}')))
  } catch (err) {
    console.error('Failed to publish friends:changed', err)
  }
}