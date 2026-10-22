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
  const conversation = await pool.query(
    `SELECT CASE WHEN user_a_id = $2 THEN user_b_id ELSE user_a_id END AS other_id
    FROM conversations
    WHERE id = $1 AND (user_a_id = $2 OR user_b_id = $2)`,
    [conversationId, ownerId]
  )
  if (conversation.rowCount === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Conversation not found' })
  }
  const otherId = conversation.rows[0].other_id

  // Only accepted friends can message each other
  const friendship = await pool.query(
    `SELECT 1 FROM friendships
     WHERE ((requester_id = $1 AND addressee_id = $2) OR (requester_id = $2 AND addressee_id = $1))
       AND status = 'accepted'`,
    [ownerId, otherId]
  )
  if (friendship.rowCount === 0) {
    throw createError({ statusCode: 403, statusMessage: 'You must be friends to send messages' })
  }
  // A block in either direction stops sending
  const blocked = await pool.query(
    `SELECT 1 FROM blocks
     WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)`,
    [ownerId, otherId]
  )
  if (blocked.rowCount > 0) {
    throw createError({ statusCode: 403, statusMessage: 'Cannot send messages to this user' })
  }

  // A retry with the same client_id matches the partial unique index and inserts nothing
  const inserted = await pool.query(
    `INSERT INTO messages (conversation_id, sender_id, body, client_id)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (sender_id, client_id) WHERE client_id IS NOT NULL DO NOTHING
     RETURNING id, sender_id, body, client_id, created_at`,
    [conversationId, ownerId, text, clientId]
  )
  if (inserted.rows.length > 0) {
    return inserted.rows[0]
  }
  // The first send was stored already, so return it. The index is not per
  // conversation, so the same client_id in another conversation finds nothing here.
  const existing = await pool.query(
    `SELECT id, sender_id, body, client_id, created_at FROM messages
     WHERE sender_id = $1 AND client_id = $2 AND conversation_id = $3`,
    [ownerId, clientId, conversationId]
  )
  if (existing.rows.length === 0) {
    throw createError({ statusCode: 409, statusMessage: 'client_id already used in another conversation' })
  }
  return existing.rows[0]
})