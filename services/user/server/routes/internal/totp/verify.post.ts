import { eq } from 'drizzle-orm'

/**
 * @brief Verifies a TOTP code at login time for a user who already has 2FA enabled.
 *        Used as the second factor after password verification succeeds in `login.post.ts`.
 *        Does not touch recovery codes - that's handled by `recovery-code/consume.post.ts`.
 * @return 200 { message } - code is valid
 *         400 { message } - missing/invalid code
 *         401 { message } - missing/invalid service token, or code did not verify
 *         404 { message } - user not found
 *         409 { message } - TOTP is not enabled for this user
 */
export default defineEventHandler(async (event) => {
  const userId = await getServiceUserId(event)
  if (userId === null) {
    setResponseStatus(event, 401)
    return { message: 'Unauthorized' }
  }
  // Read and validate the request body for the TOTP code
  const { code } = await readJsonBody(event)
  if (typeof code !== 'string' || !code) {
    setResponseStatus(event, 400)
    return { message: 'Invalid code' }
  }
  // Fetch the user from the database by ID
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  if (!user) {
    setResponseStatus(event, 404)
    return { message: 'User not found' }
  }
  // Only enabled accounts have a confirmed secret worth checking against
  if (!user.totpEnabled || !user.totpSecret) {
    setResponseStatus(event, 409)
    return { message: 'TOTP is not enabled for this user' }
  }
  if (!verifyTotpCode(user.totpSecret, code)) {
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
{ "message": "Invalid code" }

// 404 Not Found
{ "message": "User not found" }
*/