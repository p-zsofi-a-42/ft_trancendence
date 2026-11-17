/**
 * Database schema definitions for the user service.
 */
import { pgTable, bigint, text, timestamp, uuid, boolean, primaryKey, uniqueIndex, index } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  name: text('name').notNull().unique(),
  email: text('email'),
  passwordHash: text('password_hash'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  totpSecret: text('totp_secret'),
  totpEnabled: boolean('totp_enabled').notNull().default(false),
})

// providers table
export const providers = pgTable('providers', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  name: text('name').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// oauth table
export const oauth = pgTable('oauth', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  userId: bigint('user_id', { mode: 'number' }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  providerId: bigint('provider_id', { mode: 'number' }).notNull().references(() => providers.id, { onDelete: 'restrict' }),
  providerUserId: text('provider_user_id').notNull(),
  accessTokenEnc: text('access_token_enc').notNull(),
  accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
  refreshTokenEnc: text('refresh_token_enc'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('oauth_provider_user_key').on(t.providerId, t.providerUserId),
  uniqueIndex('oauth_user_provider_key').on(t.userId, t.providerId),
  index('oauth_user_idx').on(t.userId),
])

export const totpRecoveryCodes = pgTable('totp_recovery_codes', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  userId: bigint('user_id', { mode: 'number' }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  codeHash: text('code_hash').notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const friendships = pgTable('friendships', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  requesterId: bigint('requester_id', { mode: 'number' }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  addresseeId: bigint('addressee_id', { mode: 'number' }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: text('status', { enum: ['pending', 'accepted'] }).notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const blocks = pgTable('blocks', {
  blockerId: bigint('blocker_id', { mode: 'number' }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  blockedId: bigint('blocked_id', { mode: 'number' }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.blockerId, t.blockedId] })])

export const conversations = pgTable('conversations', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  userAId: bigint('user_a_id', { mode: 'number' }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  userBId: bigint('user_b_id', { mode: 'number' }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const messages = pgTable('messages', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  conversationId: bigint('conversation_id', { mode: 'number' }).notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  senderId: bigint('sender_id', { mode: 'number' }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  body: text('body').notNull(),
  clientId: uuid('client_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const conversationReads = pgTable('conversation_reads', {
  conversationId: bigint('conversation_id', { mode: 'number' }).notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  userId: bigint('user_id', { mode: 'number' }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  lastReadMessageId: bigint('last_read_message_id', { mode: 'number' }).references(() => messages.id, { onDelete: 'set null' }),
}, (t) => [primaryKey({ columns: [t.conversationId, t.userId] })])