// Utility functions for managing user presence in the application
import { createClient } from 'redis'

export const PRESENCE_WINDOW_MS = 90_000
export const PRESENCE_TTL_MS = 180_000
export const presenceKey = (userId: string) => `presence:user:${userId}:conns`
export const presenceChannel = (userId: string) => `presence:user:${userId}`

// Lua script for handling presence updates (connect, ping, disconnect)
const PRESENCE_LUA = `
-- KEYS[1] = conns set, KEYS[2] = presence channel
-- ARGV[1] = action, ARGV[2] = connId, ARGV[3] = window ms, ARGV[4] = ttl ms
local key, channel = KEYS[1], KEYS[2]
local action, connId = ARGV[1], ARGV[2]
local window, ttl = tonumber(ARGV[3]), tonumber(ARGV[4])

local t = redis.call('TIME')
local now = tonumber(t[1]) * 1000 + math.floor(tonumber(t[2]) / 1000)
local cutoff = string.format('%d', now - window)

local rawBefore = redis.call('ZCARD', key)
redis.call('ZREMRANGEBYSCORE', key, '-inf', '(' .. cutoff)
local afterPrune = redis.call('ZCARD', key)

if action == 'connect' or action == 'ping' then
  redis.call('ZADD', key, now, connId)
elseif action == 'disconnect' then
  redis.call('ZREM', key, connId)
end

local final = redis.call('ZCARD', key)
if final > 0 then redis.call('PEXPIRE', key, ttl) end

local transition = 'none'
if afterPrune == 0 and final > 0 then
  transition = 'online'
elseif rawBefore > 0 and final == 0 then
  transition = 'offline'
end
if transition ~= 'none' then
  redis.call('PUBLISH', channel, transition == 'online' and '{"online":true}' or '{"online":false}')
end
return transition
`

// Lua script for taking a snapshot of friends' presence
// Returns a list of indices of friends who are currently online
const PRESENCE_SNAPSHOT_LUA = `
-- KEYS = one conns key per friend
local t = redis.call('TIME')
local now = tonumber(t[1]) * 1000 + math.floor(tonumber(t[2]) / 1000)
local cutoff = string.format('%d', now - tonumber(ARGV[1]))

local online = {}
for i, key in ipairs(KEYS) do
  if redis.call('ZCOUNT', key, cutoff, '+inf') > 0 then
    table.insert(online, i)
  end
end
return online
`

// Redis command client setup and presence management functions

// cmd has no 'error' listener.
// Command client (not subscriber mode), so EVAL/EVALRO work
const cmd = createClient({ url: useRuntimeConfig().redisUrl })
const cmdReady = cmd.connect()

// Runs one write action and returns 'online' | 'offline' | 'none'
export async function runPresence(
  userId: string,
  action: 'connect' | 'ping' | 'disconnect' | 'prune',
  connId = '',
) {
  await cmdReady
  return cmd.eval(PRESENCE_LUA, {
    keys: [presenceKey(userId), presenceChannel(userId)],
    arguments: [action, connId, String(PRESENCE_WINDOW_MS), String(PRESENCE_TTL_MS)],
  })
}

// Returns the friend IDs that are online right now by calling the presence snapshot Lua script
export async function getOnlineFriends(friendIds: string[]): Promise<string[]> {
  await cmdReady
  const indices = await cmd.evalRo(PRESENCE_SNAPSHOT_LUA, {
    keys: friendIds.map(presenceKey),
    arguments: [String(PRESENCE_WINDOW_MS)],
  }) as number[]
  return indices
    .map(i => friendIds[i - 1])
    .filter((id): id is string => id !== undefined)
}