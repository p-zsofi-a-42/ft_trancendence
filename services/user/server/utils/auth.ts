import type { H3Event } from 'h3'
import { jwtVerify } from 'jose'
import { eq } from 'drizzle-orm'

// The web service signs a short-lived token for each request it forwards.
const rawSecret = process.env.TOKEN_SECRET
if (!rawSecret || rawSecret.length < 32) {
  throw new Error('TOKEN_SECRET must be set and at least 32 characters long')
}
const secret = new TextEncoder().encode(rawSecret)

// Returns the user id from a valid token, or null if the token is missing, expired, or wrong.
export async function getServiceUserId(event: H3Event): Promise<number | null> {
  const header = getHeader(event, 'authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer: 'web',
      audience: 'user',
      algorithms: ['HS256'],
    })
    return Number(payload.sub)
  } catch {
    return null
  }
}

// Ensures the user is an admin, throws an error if not. Returns the user ID if the user is an admin.
// Should be executed inside a try-catch block to handle potential errors.
export async function requireAdmin(event: H3Event): Promise<number> {
  const userId = await getServiceUserId(event)
  if (userId === null)
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized function' })
  const [user] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1)
  if (user?.role !== 'admin')
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  return userId
}