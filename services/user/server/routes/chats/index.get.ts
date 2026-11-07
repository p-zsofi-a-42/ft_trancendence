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
  const conversations = await listConversations(ownerId)
  return conversations
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