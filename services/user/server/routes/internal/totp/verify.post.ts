import { eq } from 'drizzle-orm'
import * as OTPAuth from 'otpauth'

/**
 * @brief Verifies a TOTP code at login time for a user who already has 2FA enabled.
 *        Used as the second factor after password verification succeeds in `login.post.ts`.
 *        Does not touch recovery codes - that's handled by `recovery-code/consume.post.ts`.
 * @return 200 { message } - code is valid
 *         400 { message } - missing/invalid userId or code
 *         404 { message } - user not found
 *         409 { message } - TOTP is not enabled for this user
 *         401 { message } - code did not verify against the stored secret
 */
export default defineEventHandler(async (event) => {
  // Read and validate the request body for userId and TOTP code
  const { userId, code } = await readJsonBody(event)
  if (
    (typeof userId !== 'string' && typeof userId !== 'number') ||
    typeof code !== 'string' || !code
  ) {
    setResponseStatus(event, 400)
    return { message: 'Invalid user id or code' }
  }
  // Fetch the user from the database by ID
  const [user] = await db.select().from(users).where(eq(users.id, Number(userId))).limit(1)
  if (!user) {
    setResponseStatus(event, 404)
    return { message: 'User not found' }
  }
  // Only enabled accounts have a confirmed secret worth checking against
  if (!user.totpEnabled || !user.totpSecret) {
    setResponseStatus(event, 409)
    return { message: 'TOTP is not enabled for this user' }
  }
  // Create a TOTP instance using the user's stored secret to validate the submitted code
  const totp = new OTPAuth.TOTP({
    issuer: 'ft_transcendence',
    label: user.email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(user.totpSecret),
  })
  // window: 1 allows the previous/next 30s step, to tolerate clock drift
  const delta = totp.validate({ token: code, window: 1 })
  if (delta === null) {
    setResponseStatus(event, 401)
    return { message: 'Invalid TOTP code' }
  }

  return { message: 'TOTP code verified' }
})

// EXAMPLE RESPONSES
/*
// 200 OK
{ "message": "TOTP code verified" }

// 401 Unauthorized
{ "message": "Invalid TOTP code" }

// 409 Conflict
{ "message": "TOTP is not enabled for this user" }

// 400 Bad Request
{ "message": "Invalid user id or code" }

// 404 Not Found
{ "message": "User not found" }
*/