import { Hash } from '@adonisjs/hash'
import { Scrypt } from '@adonisjs/hash/drivers/scrypt'

// Same scrypt settings as nuxt-auth-utils, so existing password hashes still verify.
export const passwordHasher = new Hash(new Scrypt({}))
