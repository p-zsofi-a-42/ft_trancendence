import { eq } from 'drizzle-orm'

/**
 * TODO: Potentially ask for password, before disabling TOTP for added security?
 */

/**
 * @brief Disables TOTP 2FA for a user. Clears the secret and flag, and deletes all
 *        recovery codes (used or not) so a future `setup` starts from a clean slate.
 * @return 200 { message } - TOTP disabled
 *         401 { message } - missing/invalid service token
 *         404 { message } - user not found
 *         409 { message } - TOTP is not enabled for this user
 */
export default defineEventHandler(async (event) => {
  const userId = await getServiceUserId(event)
  if (userId === null) {
    setResponseStatus(event, 401)
    return { message: 'Unauthorized' }
  }

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  if (!user) {
    setResponseStatus(event, 404)
    return { message: 'User not found' }
  }
  if (!user.totpEnabled) {
    setResponseStatus(event, 409)
    return { message: 'TOTP is not enabled for this user' }
  }

  // Clear state and wipe old recovery codes together, so a future setup starts clean
  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ totpEnabled: false, totpSecret: null })
      .where(eq(users.id, user.id))
    await tx.delete(totpRecoveryCodes).where(eq(totpRecoveryCodes.userId, user.id))
  })

  return { message: 'TOTP disabled' }
})

// EXAMPLE RESPONSES
/*
// 200 OK
{ "message": "TOTP disabled" }

// 409 Conflict
{ "message": "TOTP is not enabled for this user" }

// 401 Unauthorized
{ "message": "Unauthorized" }

// 404 Not Found
{ "message": "User not found" }
*/