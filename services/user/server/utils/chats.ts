import { and, or, eq, ne, gt, desc, sql } from 'drizzle-orm'
import { db } from './db'
import { conversations, messages, users, conversationReads } from './schema'
// Shape of a message as the frontend expects it: snake_case keys, BIGINT ids as strings.
export function toMessageResponse(m: {
  id: number
  senderId: number
  body: string
  clientId: string | null
  createdAt: Date
}) {
  return {
    id: String(m.id),
    sender_id: String(m.senderId),
    body: m.body,
    client_id: m.clientId,
    created_at: m.createdAt,
  }
}

// Returns the other member of a conversation, or null if the user is not a member.
export async function getConversationPeer(conversationId: number, userId: number): Promise<number | null> {
  const [row] = await db
    .select({ userAId: conversations.userAId, userBId: conversations.userBId })
    .from(conversations)
    .where(
      and(
        eq(conversations.id, conversationId),
        or(eq(conversations.userAId, userId), eq(conversations.userBId, userId)),
      ),
    )
    .limit(1)
  if (!row) return null
  return row.userAId === userId ? row.userBId : row.userAId
}

// All conversations of a user with the friend's name, the last message and the unread count.
export async function listConversations(ownerId: number) {
  const lastMessage = (column: typeof messages.body | typeof messages.createdAt) => sql`(
    SELECT ${column} FROM ${messages}
    WHERE ${messages.conversationId} = ${conversations.id}
    ORDER BY ${messages.id} DESC LIMIT 1
  )`

  const unread = db
    .select({ n: sql<number>`count(*)` })
    .from(messages)
    .where(
      and(
        eq(messages.conversationId, conversations.id),
        ne(messages.senderId, ownerId),
        gt(messages.id, sql`COALESCE(${conversationReads.lastReadMessageId}, 0)`),
      ),
    )

  const rows = await db
    .select({
      id: conversations.id,
      friendId: users.id,
      friendName: users.name,
      lastMessageBody: sql<string | null>`${lastMessage(messages.body)}`,
      lastMessageAt: sql<string | null>`${lastMessage(messages.createdAt)}`,
      unreadCount: sql<string>`(${unread})`,
    })
    .from(conversations)
    .innerJoin(
      users,
      sql`${users.id} = CASE WHEN ${conversations.userAId} = ${ownerId} THEN ${conversations.userBId} ELSE ${conversations.userAId} END`,
    )
    .leftJoin(
      conversationReads,
      and(eq(conversationReads.conversationId, conversations.id), eq(conversationReads.userId, ownerId)),
    )
    .where(or(eq(conversations.userAId, ownerId), eq(conversations.userBId, ownerId)))
    .orderBy(desc(sql`COALESCE(${lastMessage(messages.createdAt)}, ${conversations.createdAt})`))

  return rows.map((r) => ({
    id: String(r.id),
    friend_id: String(r.friendId),
    friend_name: r.friendName,
    last_message_body: r.lastMessageBody,
    // Raw SQL timestamps arrive as text; the Date keeps the JSON an ISO string like before
    last_message_at: r.lastMessageAt === null ? null : new Date(r.lastMessageAt),
    unread_count: String(r.unreadCount),
  }))
}
