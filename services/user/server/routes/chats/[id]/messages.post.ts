import { and, or, eq, sql } from "drizzle-orm"
import { redisPub, redisPubReady } from "~/utils/redis"

/**
 * POST /chats/:id/messages
 * Sends a message in a conversation the caller belongs to.
 *
 * Body:
 * - body: the message text, 1 to 2000 characters after trimming
 * - client_id: optional UUID chosen by the client. Sending the same client_id
 *   again returns the original message instead of creating a duplicate.
 *
 * Returns the stored message: id, sender_id, body, client_id, created_at.
 * Errors: 400 for invalid input, 401 if not logged in, 404 if not a member,
 * 403 if the users are not friends or have blocked each other,
 * 409 if the client_id was already used in another conversation.
 */
export default defineEventHandler(async (event) => {
  // User-Check
  const ownerId = await getServiceUserId(event)
  if (ownerId === null) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  // Validate the inputs. Up to 18 digits always fits in a BIGINT.
  const conversationId = getRouterParam(event, 'id')
  if (!conversationId || !/^\d{1,18}$/.test(conversationId)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid conversation ID' })
  }
  const body = await readJsonBody(event)
  const text = typeof body.body === 'string' ? body.body.trim() : ''
  // Spreading the string counts characters the way Postgres char_length does
  if (text === '' || [...text].length > 2000) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid message body' })
  }
  const clientId = body.client_id ?? null
  if (clientId !== null && (typeof clientId !== 'string'
    || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clientId))) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid client ID' })
  }

  // Check membership before sending any messages
  const otherId = await getConversationPeer(Number(conversationId), ownerId)
  if (otherId === null) {
    throw createError({ statusCode: 404, statusMessage: 'Conversation not found' })
  }

  // Only accepted friends can message each other
  const [friendship] = await db
    .select({ id: friendships.id })
    .from(friendships)
    .where(
      and(
        or(
          and(eq(friendships.requesterId, ownerId), eq(friendships.addresseeId, otherId)),
          and(eq(friendships.requesterId, otherId), eq(friendships.addresseeId, ownerId)),
        ),
        eq(friendships.status, 'accepted'),
      ),
    )
    .limit(1)
  if (!friendship) {
    throw createError({ statusCode: 403, statusMessage: 'You must be friends to send messages' })
  }
  // A block in either direction stops sending
  const [blocked] = await db
    .select({ id: blocks.blockerId })
    .from(blocks)
    .where(
      or(
        and(eq(blocks.blockerId, ownerId), eq(blocks.blockedId, otherId)),
        and(eq(blocks.blockerId, otherId), eq(blocks.blockedId, ownerId)),
      ),
    )
    .limit(1)
  if (blocked) {
    throw createError({ statusCode: 403, statusMessage: 'Cannot send messages to this user' })
  }

  const columns = {
    id: messages.id,
    senderId: messages.senderId,
    body: messages.body,
    clientId: messages.clientId,
    createdAt: messages.createdAt,
  }
  // A retry with the same client_id matches the partial unique index and inserts nothing
  const [inserted] = await db
    .insert(messages)
    .values({ conversationId: Number(conversationId), senderId: ownerId, body: text, clientId })
    .onConflictDoNothing({
      target: [messages.senderId, messages.clientId],
      where: sql`${messages.clientId} IS NOT NULL`,
    })
    .returning(columns)
  if (inserted) {
    const message = toMessageResponse(inserted)
    await redisPubReady
    await redisPub.publish(`chat:conv:${conversationId}`, JSON.stringify({ type: 'message', message }))
    return message
  }
  // The first send was stored already, so return it. The index is not per
  // conversation, so the same client_id in another conversation finds nothing here.
  const [existing] = await db
    .select(columns)
    .from(messages)
    .where(
      and(
        eq(messages.senderId, ownerId),
        eq(messages.clientId, clientId),
        eq(messages.conversationId, Number(conversationId)),
      ),
    )
  if (!existing) {
    throw createError({ statusCode: 409, statusMessage: 'client_id already used in another conversation' })
  }

  return toMessageResponse(existing)
})
