import { and, or, eq } from 'drizzle-orm'

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

  const friendId = Number(id)

  // VERIFY USERS ARE FRIENDS AND NOT BLOCKED
  const [friendship] = await db
    .select({ id: friendships.id })
    .from(friendships)
    .where(
      and(
        or(
          and(eq(friendships.requesterId, ownerId), eq(friendships.addresseeId, friendId)),
          and(eq(friendships.requesterId, friendId), eq(friendships.addresseeId, ownerId)),
        ),
        eq(friendships.status, 'accepted'),
      ),
    )
    .limit(1)
  if (!friendship) {
    throw createError({ statusCode: 403, statusMessage: 'You must be friends to start a conversation' })
  }
  const [blocked] = await db
    .select({ id: blocks.blockerId })
    .from(blocks)
    .where(
      or(
        and(eq(blocks.blockerId, ownerId), eq(blocks.blockedId, friendId)),
        and(eq(blocks.blockerId, friendId), eq(blocks.blockedId, ownerId)),
      ),
    )
    .limit(1)
  if (blocked) {
    throw createError({ statusCode: 403, statusMessage: 'Cannot start a conversation with this user' })
  }

  // CREATE OR FETCH CONVERSATION
  // @INFO: The smaller ID is always stored as user_a_id so each pair has one row.
  const userAId = Math.min(ownerId, friendId)
  const userBId = Math.max(ownerId, friendId)
  const columns = {
    id: conversations.id,
    userAId: conversations.userAId,
    userBId: conversations.userBId,
    createdAt: conversations.createdAt,
  }
  let [conversation] = await db
    .insert(conversations)
    .values({ userAId, userBId })
    .onConflictDoNothing()
    .returning(columns)
  // If the conversation already exists, fetch and return it
  if (!conversation) {
    [conversation] = await db
      .select(columns)
      .from(conversations)
      .where(and(eq(conversations.userAId, userAId), eq(conversations.userBId, userBId)))
  }
  return {
    id: String(conversation.id),
    user_a_id: String(conversation.userAId),
    user_b_id: String(conversation.userBId),
    created_at: conversation.createdAt,
  }
})
