// Types related to chats (direct messages between friends)

// One row of GET /chats. Postgres BIGINT and COUNT values arrive as strings.
export interface ConversationEntry {
  id: string
  friend_id: string
  friend_name: string
  last_message_body: string | null
  last_message_at: string | null
  unread_count: string
}

// Response of POST /chats (the conversation with a friend, created or existing).
export interface ConversationResult {
  id: string
  user_a_id: string
  user_b_id: string
  created_at: string
}

// One message, as returned by GET /chats/:id/messages and POST /chats/:id/messages.
export interface ChatMessage {
  id: string
  sender_id: string
  body: string
  client_id: string | null
  created_at: string
}

// Response of POST /chats/:id/read.
export interface ReadResult {
  conversation_id: string
  user_id: string
  last_read_message_id: string | null
}