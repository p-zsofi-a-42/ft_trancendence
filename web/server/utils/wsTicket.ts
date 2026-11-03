// web/server/utils/wsTicket.ts
import { SignJWT, jwtVerify } from 'jose'

// Utility functions for signing and verifying WebSocket tickets (JWTs)
export async function signWsTicket(userId: string | number, scope: 'chat' | 'game', resourceId: string) {
  return new SignJWT({ scope, resourceId })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(userId))
    .setIssuer('web').setAudience('ws')
    .setExpirationTime('15s')
    .setIssuedAt()
    .sign(new TextEncoder().encode(useRuntimeConfig().tokenSecret))
}

// Verifies a WebSocket ticket (JWT) and returns its payload.
export async function verifyWsTicket(ticket: string) {
  const { payload } = await jwtVerify(ticket, new TextEncoder().encode(useRuntimeConfig().tokenSecret), {
    issuer: 'web', audience: 'ws',
  })
  return payload as { sub: string; scope: 'chat' | 'game'; resourceId: string }
}