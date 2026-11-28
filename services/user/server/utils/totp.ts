import * as OTPAuth from 'otpauth'

// Checks a 6-digit code against a base32 secret, allowing one 30s step of clock drift.
export function verifyTotpCode(secret: string, code: string): boolean {
  const totp = new OTPAuth.TOTP({
    issuer: 'ft_transcendence',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  })
  return totp.validate({ token: code, window: 1 }) !== null
}
