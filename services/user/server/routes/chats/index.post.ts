/*
// @brief Creates a new chat conversation between the authenticated user and 
//   the specified user ID
// @return The created or existing conversation object 
//  containing: id, user_a_id, user_b_id, and created_at
*/
export default defineEventHandler(async (event) => {
  // Get ID's and validate them
  const { id } = await readJsonBody(event)
  if (typeof id !== 'string' || !/^\d+$/.test(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid user ID' })
  }
  const ownerId = await getServiceUserId(event)
  if (ownerId === null) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  if (String(ownerId) === id) {
    throw createError({ statusCode: 400, statusMessage: 'You cannot start a conversation with yourself' })
  }

  // VERIFY USERS ARE FRIENDS AND NOT BLOCKED
  const friendship = await pool.query(
    `SELECT 1 FROM friendships
    WHERE (requester_id = $1 AND addressee_id = $2 AND status = 'accepted')
       OR (requester_id = $2 AND addressee_id = $1 AND status = 'accepted')`,
    [ownerId, id],
  )
  if (friendship.rows.length === 0) {
    throw createError({ statusCode: 403, statusMessage: 'You must be friends to start a conversation' })
  }
  const blocked = await pool.query(
    `SELECT 1 FROM blocks
    WHERE (blocker_id = $1 AND blocked_id = $2)
        OR (blocker_id = $2 AND blocked_id = $1)`,
    [ownerId, id],
  )
  if (blocked.rows.length > 0) {
    throw createError({ statusCode: 403, statusMessage: 'Cannot start a conversation with this user' })
  }

  // CREATE OR FETCH CONVERSATION
  // @INFO: LEAST and GREATEST are used to ensure consistent ordering of 
  // user IDs in the conversation.
  const conversation = await pool.query(
    `INSERT INTO conversations (user_a_id, user_b_id)
     VALUES (LEAST($1::bigint, $2::bigint), GREATEST($1::bigint, $2::bigint))
     ON CONFLICT (user_a_id, user_b_id) DO NOTHING
     RETURNING id, user_a_id, user_b_id, created_at`,
    [ownerId, id],
  )
  if (conversation.rows.length > 0) {
    return conversation.rows[0]
  }
  // If the conversation already exists, fetch and return it
  const existingConversation = await pool.query(
    `SELECT id, user_a_id, user_b_id, created_at FROM conversations
     WHERE (user_a_id = LEAST($1::bigint, $2::bigint)
      AND user_b_id = GREATEST($1::bigint, $2::bigint))`,
    [ownerId, id],
  )
  return existingConversation.rows[0]
})