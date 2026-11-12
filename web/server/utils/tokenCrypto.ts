import { createCipheriv, randomBytes } from 'node:crypto'

// Encrypts a provider token with AES-256-GCM. Output format: base64(iv):base64(authTag):base64(ciphertext)
export function encryptToken(plaintext: string): string {
  const key = Buffer.from(useRuntimeConfig().oauthTokenKey, 'base64')
  if (key.length !== 32) {
    throw createError({ statusCode: 500, statusMessage: 'NUXT_OAUTH_TOKEN_KEY must be 32 bytes, base64 encoded' })
  }
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  return [iv, cipher.getAuthTag(), ciphertext].map((part) => part.toString('base64')).join(':')
}
