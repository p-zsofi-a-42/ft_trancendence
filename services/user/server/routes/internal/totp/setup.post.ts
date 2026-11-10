import { eq } from 'drizzle-orm'
import * as OTPAuth from 'otpauth'

/**
 * @brief Starts TOTP 2FA setup for an already-authenticated user. Generates a new
 *        secret and stores it on the user row as *unconfirmed* (totp_secret set,
 *        totp_enabled still false). Blocked if TOTP is already enabled; repeat calls
 *        while unconfirmed simply overwrite the pending secret (e.g. user lost the QR code).
 * @return 200 { message, secret, otpauthUrl } - secret (base32) and otpauth:// URL for the FE QR code
 *         400 { message } - missing/invalid userId
 *         404 { message } - user not found
 *         409 { message } - TOTP already enabled for this user
 */
export default defineEventHandler(async (event) => {
  const { userId } = await readJsonBody(event)
  if (typeof userId !== 'string' && typeof userId !== 'number') {
    setResponseStatus(event, 400)
    return { message: 'Invalid user id' }
  }

  const [user] = await db.select().from(users).where(eq(users.id, Number(userId))).limit(1)
  if (!user) {
    setResponseStatus(event, 404)
    return { message: 'User not found' }
  }

  if (user.totpEnabled) {
    setResponseStatus(event, 409)
    return { message: 'TOTP is already enabled' }
  }

  // Secret is stored unconfirmed; totp_enabled stays false until `enable` verifies a code.
  const secret = new OTPAuth.Secret({ size: 20 })
  const totp = new OTPAuth.TOTP({
    issuer: 'ft_transcendence',
    label: user.email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret,
  })

  await db.update(users).set({ totpSecret: secret.base32 }).where(eq(users.id, user.id))

  return {
    message: 'TOTP setup initiated',
    secret: secret.base32,
    otpauthUrl: totp.toString(),
  }
})

/*
 * otpauthUrl -> gets encoded into QR image on the frontend(e.g. via a qrcode package); 
 * the raw secret is shown as a fallback for manual entry in authenticator apps
*/

// Return/output example:
// 200 OK
// {
//   "message": "TOTP setup initiated",
//   "secret": "JBSWY3DPEHPK3PXP",
//   "otpauthUrl": "otpauth://totp/ft_transcendence:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=ft_transcendence"
// }

// 400 Bad Request
// { "message": "Invalid user id" }
// 404 Not Found
// { "message": "User not found" }
// 409 Conflict
// { "message": "TOTP is already enabled" }
