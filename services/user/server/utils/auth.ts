import type { H3Event } from 'h3'
import { jwtVerify } from 'jose'

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
