import { eq, and, isNull } from 'drizzle-orm'

/**
 * @brief Fallback login path when a user can't produce a TOTP code (e.g. lost device).
 *        Checks the submitted code against the user's unused recovery codes, and marks
 *        the matching one as used so it can never be consumed again.
 * @return 200 { message } - code is valid, login may proceed
 *         400 { message } - missing/invalid code
 *         401 { message } - missing/invalid service token, or code did not match
 *         404 { message } - user not found
 *         409 { message } - TOTP is not enabled for this user
 */
export default defineEventHandler(async (event) => {
  const userId = await getServiceUserId(event)
  if (userId === null) {
    setResponseStatus(event, 401)
    return { message: 'Unauthorized' }
  }
  // Read and validate the request body for the recovery code
  const { code } = await readJsonBody(event)
  if (typeof code !== 'string' || !code) {
    setResponseStatus(event, 400)
    return { message: 'Invalid code' }
  }
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  if (!user) {
    setResponseStatus(event, 404)
    return { message: 'User not found' }
  }
  if (!user.totpEnabled || !user.totpSecret) {
    setResponseStatus(event, 409)
    return { message: 'TOTP is not enabled for this user' }
  }

  // Hashes are salted, so we can't look up by codeHash directly 
  // - check against each unused one
  const unusedCodes = await db
    .select()
    .from(totpRecoveryCodes)
    .where(and(eq(totpRecoveryCodes.userId, user.id), isNull(totpRecoveryCodes.usedAt)))

  // Iterate over each unused recovery code and check if it matches the submitted code
  let matchedId: number | null = null
  for (const row of unusedCodes) {
    if (await passwordHasher.verify(row.codeHash, code)) {
      matchedId = row.id
      break
    }
  }
  if (matchedId === null) {
    setResponseStatus(event, 401)
    return { message: 'Invalid or already used recovery code' }
  }
  // Mark the matched recovery code as used so it can't be reused
  await db
    .update(totpRecoveryCodes)
    .set({ usedAt: new Date() })
    .where(eq(totpRecoveryCodes.id, matchedId))

  return { message: 'Recovery code accepted' }
})

// EXAMPLE RESPONSES
/*
// 200 OK
{ "message": "Recovery code accepted" }

// 401 Unauthorized
{ "message": "Invalid or already used recovery code" }

// 409 Conflict
{ "message": "TOTP is not enabled for this user" }

// 400 Bad Request
{ "message": "Invalid code" }

// 404 Not Found
{ "message": "User not found" }
*/