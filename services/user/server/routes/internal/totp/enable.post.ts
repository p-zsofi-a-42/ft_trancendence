import { eq } from 'drizzle-orm'
import * as OTPAuth from 'otpauth'
import { randomBytes } from 'node:crypto'

const RECOVERY_CODE_COUNT = 8

// e.g. "A1B2-C3D4" - readable, URL-safe, easy to type from a printed sheet
function generateRecoveryCode(): string {
  const raw = randomBytes(5).toString('hex').toUpperCase() // 10 hex chars
  return `${raw.slice(0, 5)}-${raw.slice(5)}`
}

/**
 * @brief Confirms TOTP 2FA setup for an already-authenticated user. Verifies the
 *        submitted 6-digit code against the pending (unconfirmed) secret from
 *        `setup`, then flips totp_enabled to true and issues a one-time batch of
 *        recovery codes (stored hashed, returned once in plaintext).
 * @return 200 { message, recoveryCodes } - plaintext recovery codes, shown only this once
 *         400 { message } - missing/invalid code, or no pending setup
 *         401 { message } - missing/invalid service token
 *         404 { message } - user not found
 *         409 { message } - TOTP already enabled for this user
 *         401 { message } - code did not verify against the pending secret
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
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  if (!user) {
    setResponseStatus(event, 404)
    return { message: 'User not found' }
  }
  // Check if TOTP is already enabled or if there is a pending setup
  if (user.totpEnabled) {
    setResponseStatus(event, 409)
    return { message: 'TOTP is already enabled' }
  }
  if (!user.totpSecret) {
    setResponseStatus(event, 400)
    return { message: 'No pending TOTP setup for this user' }
  }
  // Create a TOTP instance using the user's pending secret to validate the submitted code
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
  // Generate recovery codes for the user
  const recoveryCodes = Array.from({ length: RECOVERY_CODE_COUNT }, generateRecoveryCode)
  const recoveryCodeRows = await Promise.all(
    recoveryCodes.map(async (plain) => ({
      userId: user.id,
      codeHash: await passwordHasher.make(plain),
    }))
  )
  // Store the recovery codes and enable TOTP in a transaction
  await db.transaction(async (tx) => {
    await tx.update(users).set({ totpEnabled: true }).where(eq(users.id, user.id))
    await tx.insert(totpRecoveryCodes).values(recoveryCodeRows)
  })

  return {
    message: 'TOTP enabled',
    recoveryCodes,
  }
})

// EXAMPLE RESPONSES
/*
// 200 OK
{
  "message": "TOTP enabled",
  "recoveryCodes": ["A1B2-C3D4", "9F8E-7D6C", "...6 more"]
}

// 401 Unauthorized
{ "message": "Invalid TOTP code" }

// 400 Bad Request
{ "message": "No pending TOTP setup for this user" }

// 401 Unauthorized
{ "message": "Unauthorized" }

// 404 Not Found
{ "message": "User not found" }

// 409 Conflict
{ "message": "TOTP is already enabled" }
*/