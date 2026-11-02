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
  const membership = await pool.query(
    `SELECT 1 FROM conversations
     WHERE id = $1 AND (user_a_id = $2 OR user_b_id = $2)`,
    [conversationId, ownerId]
  )
  if (membership.rowCount === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Conversation not found' })
  }

  // The insert only happens if the message belongs to this conversation.
  // ON CONFLICT ... DO UPDATE handles the first read and later reads
  // GREATEST keeps the stored position from moving backwards.
  const result = await pool.query(
    `INSERT INTO conversation_reads (conversation_id, user_id, last_read_message_id)
     SELECT $1::bigint, $2::bigint, id FROM messages
     WHERE id = $3::bigint AND conversation_id = $1::bigint
     ON CONFLICT (conversation_id, user_id) DO UPDATE
       SET last_read_message_id = GREATEST(conversation_reads.last_read_message_id, EXCLUDED.last_read_message_id)
     RETURNING conversation_id, user_id, last_read_message_id`,
    [conversationId, ownerId, lastMessageId]
  )
  if (result.rows.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Message not found in this conversation' })
  }
  return result.rows[0]
})