import { and, eq, lt, desc } from 'drizzle-orm'

/**
 * GET /chats/:id/messages
 * Returns one page of messages from a conversation the caller belongs to, newest first.
 *
 * Query parameters:
 * - before: only return messages with an id lower than this (used to load older messages)
 * - limit: number of messages to return, from 1 to 100 (default 50)
 *
 * Errors: 400 for invalid input, 401 if not logged in, 
 *  404 if not a member of the conversation.
 */
export default defineEventHandler(async (event) => {
  // User-Check
  const ownerId = await getServiceUserId(event)
  if (ownerId === null) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  // Validate the inputs
  const conversationId = getRouterParam(event, 'id')
  if (!/^\d+$/.test(conversationId)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid conversation ID' })
  }
  const before = getQuery(event).before || null
  if (before !== null && (typeof before !== 'string' || !/^\d+$/.test(before))) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid before ID' })
  }
  // A missing or empty ?limit= uses the default
  const rawLimit = getQuery(event).limit || undefined
  if (rawLimit !== undefined && (typeof rawLimit !== 'string' || !/^\d+$/.test(rawLimit))) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid limit' })
  }
  const limit = rawLimit === undefined ? 50 : Number(rawLimit)
  if (limit < 1 || limit > 100) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid limit' })
  }

  // Check membership before reading any messages
  if (await getConversationPeer(Number(conversationId), ownerId) === null) {
    throw createError({ statusCode: 404, statusMessage: 'Conversation not found' })
  }
  // Load one page of messages
  const rows = await db
    .select({
      id: messages.id,
      senderId: messages.senderId,
      body: messages.body,
      clientId: messages.clientId,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(
      and(
        eq(messages.conversationId, Number(conversationId)),
        before === null ? undefined : lt(messages.id, Number(before)),
      ),
    )
    .orderBy(desc(messages.id))
    .limit(limit)
  return rows.map(toMessageResponse)
})
