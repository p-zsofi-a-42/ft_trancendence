import { and, eq, sql } from 'drizzle-orm'

/**
 * POST /chats/:id/read
 * Marks messages in a conversation as read up to the given message.
 *
 * Body:
 * - last_message_id: id of the newest message the user has seen
 *
 * The read position never moves backwards: an older id is ignored.
 * Returns: conversation_id, user_id, last_read_message_id (the stored position).
 * Errors: 400 for invalid input or a message outside this conversation,
 * 401 if not logged in, 404 if not a member.
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
  const lastMessageId = body.last_message_id
  if (typeof lastMessageId !== 'string' || !/^\d{1,18}$/.test(lastMessageId)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid message ID' })
  }

  // Check membership before touching the read position
  if (await getConversationPeer(Number(conversationId), ownerId) === null) {
    throw createError({ statusCode: 404, statusMessage: 'Conversation not found' })
  }

  // The insert only happens if the message belongs to this conversation.
  // On conflict the stored position is updated, and GREATEST keeps it from moving backwards.
  const [result] = await db
    .insert(conversationReads)
    .select(
      db
        .select({
          conversationId: sql<number>`${Number(conversationId)}::bigint`.as('conversation_id'),
          userId: sql<number>`${ownerId}::bigint`.as('user_id'),
          lastReadMessageId: messages.id,
        })
        .from(messages)
        .where(and(eq(messages.id, Number(lastMessageId)), eq(messages.conversationId, Number(conversationId)))),
    )
    .onConflictDoUpdate({
      target: [conversationReads.conversationId, conversationReads.userId],
      set: {
        lastReadMessageId: sql`GREATEST(${conversationReads.lastReadMessageId}, EXCLUDED.last_read_message_id)`,
      },
    })
    .returning()
  if (!result) {
    throw createError({ statusCode: 400, statusMessage: 'Message not found in this conversation' })
  }
  return {
    conversation_id: String(result.conversationId),
    user_id: String(result.userId),
    last_read_message_id: result.lastReadMessageId === null ? null : String(result.lastReadMessageId),
  }
})
