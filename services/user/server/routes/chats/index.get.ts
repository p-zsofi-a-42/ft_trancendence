/*
// @brief Fetches all chat conversations for the authenticated user
// @return An array of conversation objects 
//  containing: 
//    friend_id, friend_name, last_message_body, last_message_at, unread_count
*/ 
// [] TODO: Query lists every conversation (unfriended or blocked ones should 
//          be excluded)
export default defineEventHandler(async (event) => {
  const ownerId = await getServiceUserId(event)
  if (ownerId === null) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  // FETCH ALL CONVERSATIONS FOR THE AUTHENTICATED USER
  const conversations = await pool.query(
    `SELECT c.id,
            f.id AS friend_id,
            f.name AS friend_name,
            lm.body AS last_message_body,
            lm.created_at AS last_message_at,
            (SELECT COUNT(*) FROM messages m
              WHERE m.conversation_id = c.id
                AND m.sender_id <> $1
                AND m.id > COALESCE(r.last_read_message_id, 0)) AS unread_count
    FROM conversations c
    JOIN users f ON f.id = CASE WHEN c.user_a_id = $1 THEN c.user_b_id ELSE c.user_a_id END
    LEFT JOIN conversation_reads r ON r.conversation_id = c.id AND r.user_id = $1
    LEFT JOIN LATERAL (
      SELECT body, created_at FROM messages
      WHERE conversation_id = c.id
      ORDER BY id DESC
      LIMIT 1
    ) lm ON true
    WHERE c.user_a_id = $1 OR c.user_b_id = $1
    ORDER BY COALESCE(lm.created_at, c.created_at) DESC;`,
    [ownerId]
  )
  return conversations.rows
})

/* QUERY EXPLANATION
- friend_id / JOIN users f: the friend is whichever of the two ids isn't the 
    caller. The CASE picks it.
- LEFT JOIN LATERAL: gets the newest message for each conversation. 
    The LEFT keeps conversations that have no messages yet.
- unread_count: counts messages from the other person that come after the 
    caller's read pointer. COALESCE(..., 0) handles the case where no read 
    record exists yet.
- ORDER BY: sorts by the last message, or by the conversation's creation time 
    if it has none.
- Only $1 is a parameter: the query takes the caller's id from the token, never 
    from the request.
*/