// API endpoint to handle game invites
import type { ConversationEntry } from '#shared/types/chats'

/**
 * POST /api/game/invite
 * Body: { friendId: string }
 * Requires user session
 @brief asks for the chatId, and sends a link to invite the friend to the game
 */
export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const { body, friendId } = await readBody(event)
  if (typeof friendId !== 'string' || !/^\d+$/.test(friendId)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid friend ID' })
  }
  // ask for the chatId associated with the friend
  const chat = await callUserService<ConversationEntry[]>('/chats', { method: 'GET', userId: user.id })
  if (!chat || chat.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'No chats found for user' })
  }
  const chatId = chat.find(c => c.friend_id === friendId)?.id
  if (!chatId) {
    throw createError({ statusCode: 404, 
                        statusMessage: 'Chat with friend not found' })
  }

  // send link to invite the friend to the game
  // await callUserService(`'/chats/' + ${chatId} + '/message'`, 
  //                       { method: 'POST', 
  //                       userId: user.id, 
  //                       body: { content: 'Join my game!' }   
  //                       }
  // )
  await callUserService<ChatMessage>(
      `/chats/${encodeURIComponent(chatId)}/messages`,
      { body: { body, friendId: friendId }, userId: user.id },
    )
  return { success: true }
})