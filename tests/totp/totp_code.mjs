#!/usr/bin/env node
// Generates the current TOTP code for a base32 secret (RFC 6238), so the smoke
// test script can act as a stand-in authenticator app. No external deps.
// Takes the base32-encoded secret as a command-line argument (received by enable 2FA).
import { createHmac } from 'node:crypto'

function base32Decode(base32) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let bits = ''
  for (const char of base32.toUpperCase().replace(/=+$/, '')) {
    const val = alphabet.indexOf(char)
    if (val === -1) throw new Error(`Invalid base32 character: ${char}`)
    bits += val.toString(2).padStart(5, '0')
  }
  const bytes = []
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2))
  }
  return Buffer.from(bytes)
}

function generateTotp(secretBase32, { digits = 6, period = 30, timeMs = Date.now() } = {}) {
  const counter = Math.floor(timeMs / 1000 / period)
  const counterBuf = Buffer.alloc(8)
  counterBuf.writeBigUInt64BE(BigInt(counter))

  const key = base32Decode(secretBase32)
  const hmac = createHmac('sha1', key).update(counterBuf).digest()

  const offset = hmac[hmac.length - 1] & 0x0f
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)

  return String(binary % 10 ** digits).padStart(digits, '0')
}

const secret = process.argv[2]
if (!secret) {
  console.error('Usage: totp_code.mjs <base32-secret>')
  process.exit(1)
}
console.log(generateTotp(secret))
