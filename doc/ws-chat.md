# Redis pub/sub
```text
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                   BROWSER (Vue page)                                │
│                         web/app/pages/chats/[id].vue                                │
│                                                                                     │
│   onMounted ──► connectChatSocket()                                                 │
│                                                                                     │
└───────────────────────┬───────────────────────────────────┬─────────────────────────┘
                        │ ① POST /api/chats/:id/ws-ticket  │ ④ WebSocket connect
                        │   (needs cookie session)          │   wss://.../ws/chat?ticket=...
                        ▼                                   ▼
┌──────────────────────────────────────────────┐      ┌──────────────────────────────────────┐
│   WEB service (Nuxt server, BFF)             │      │  WEB service                         │
│  server/api/chats/[id]/ws-ticket.post.ts     │      │  server/routes/ws/chat.ts            │
│                                              │      │  defineWebSocketHandler({...})       │
│ requireUserSession(event) → user.id          │      │                                      │
│ signWsTicket(user.id, 'chat', conversationId)│      │ upgrade(request):                    │
│   → short-lived JWT (15s!), HS256,           │      │   - read ?ticket= from URL           │
│   issuer 'web', audience 'ws'                │      │   - verifyWsTicket(ticket)           │
│                                              │      │   - checks scope === 'chat'          │
│ ② returns { ticket }  ────────────────────► │      │   - stores userId/conversationId     │
└──────────────────────────────────────────────┘      │     on request.context               │
                         │                            │                                      │
                         │ ③ ticket stored briefly   │ open(peer):                          │
                         ▼ (never cached, reused)     │   addPeer(conversationId, peer)      │
                    used to build the ws URL          │     → peer added to in-memory Set    │
                                                      │     → if first peer for this conv,   │
                                                      │       SUBSCRIBE chat:conv:<id> on    │
                                                      │       Redis                          │
                                                      │                                      │
                                                      │ close(peer): removePeer(...)         │
                                                      │   → if last peer leaves, UNSUBSCRIBE │
                                                      └──────────────────┬───────────────────┘
                                                                         │
                                                              Redis Pub/Sub channel
                                                              "chat:conv:<conversationId>"
                                                                         ▲
                                                                         │ PUBLISH
┌────────────────────────────────────────────────────────────────────────────────────┐
│  USER service (internal, separate container)                                       │
│  server/routes/chats/[id]/messages.post.ts                                         │
│                                                                                    │
│  ⑤ User A sends message via REST:                                                 │
│     web: POST /api/chats/:id/messages ──► user-service: POST /chats/:id/messages   │
│     - auth/friendship/block checks                                                 │
│     - INSERT INTO messages ... RETURNING ...                                       │
│     - redisPub.publish('chat:conv:<id>', { type:'message', message })  ◄── ⑥      │
│     - HTTP response returns the saved message directly to the sender too           │
└────────────────────────────────────────────────────────────────────────────────────┘
```

## The round trip for one message, step by step:

1. **Open connection** (on mount/ on naviagting t a new conversation): the page calls `POST /api/chats/:id/ws-ticket` ([ws-ticket.post.ts](/web/server/api/chats/[id]/ws-ticket.post.ts)). 
This uses the existing cookie session (`requireUserSession`) to mint a tiny, **15-second-lived-JWT**("ticket") via [signWsTicket](/web/server/utils/wsTicket.ts#L7) - scoped to `'chat'` and this one `conversationId`.

2. Browser opens `wss://.../ws/chat?ticket=<jwt>` ([[id].vue](/web/app/pages/chats/[id].vue#L95)). WebSockets can't send custom headers/cookies cross-context easily, so the ticket-in-URL is the auth mechanism intead of the session cookie.

3. Server-side `upgrade()` in [ws/chats.ts](/web/server/routes/ws/chat.ts#L35) verifies the ticket (`verifyWsTicket`), checks `scope === 'chat'`, and stashes `userId`/`conversationId` on the connection's context -- rejecting with 401/403 otherwise.

4. On `open`, the peer (socket) is added to an in-memory `Map<conversationId, Set<peer>>` ([addPeer](/web/server/routes/ws/chat.ts#L9)). The **first** peer for a conversation triggers a Redis `SUBSCRIBE chat:conv:<id>`; later peers just join the existing set. This means the web server only keeps one Redis subscription per active conversation, no matter how many tabs/users are in it.

5. **Sending** a message doesnt't go over the socket at all - it's a plain `POST /api/chats/:id/messages`, forwarded to the **user service**, which does the auth/friendship/block checks, inserts the row, and the `PUBLISH`es it on `chat:conv<id>` in Redis ([messages.post.ts](/services/user/server/routes/chats/[id]/messages.post.ts#L82)). The sender also gets the saves message back directly as the HTTP response (used for the optimistic UI update).

6. Redis fans that published message out to every **web** instance subscribed to that channel; each instance's subscription callback pushes the raw JSON to every `peer` in its local `Set` for that conversation ([ws/chat.ts](/web/server/routes/ws/chat.ts#L15)).

7. In the browser, `socket.onmessage` parses the payload and appends it to `data.value`, **deduping by message id** so the sender doesn't see their own message twice (once from the HTTP response, once from the socket echo).

8. On close/unmount or when switching conversations, the client closes the socket: `close` removes the peer and, if it was the last one for that conversation, usubscribes from Redis.

9. If the socket drops unexectedly (`onclose` without `closedByUs`), the client auto-reconnects after 2s, fetching a **brand-new ticket** each time (tickets are single-use/short-lived by design, newver cached).

**Why Redis is involved at all: since the ticket, the socket and the HTTP message endpoint can be handled by different instances/processes of the web or user service, Redis Pub/Sub is the fan-out layer that lets "a message was inserted by the user-service" reach "all browser sockets subscribed to that conversation," regardless of which web instance holds which socket.