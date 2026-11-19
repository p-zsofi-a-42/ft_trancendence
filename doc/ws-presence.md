# Online presence for friends

Logged-in users see a green dot next to each **accepted friend** who is currently online. Only friends are ever sent, so the dot never reveals the status of other users.

## Overview

- **Per-user presence in Redis:** each user has a sorted set of open browser connections. The user is online while at least one connection is fresh.
- **Atomic transitions:** a Lua script decides when a user goes online or offline, and publishes only real changes.
- **Push plus snapshots:** friends' changes are pushed over pub/sub. Each connection also gets a full snapshot on open and every 60 s, so stale state is corrected.
- **Friend changes are applied immediately:** accepting, removing, or blocking a friend updates the affected sockets right away.

## How it works

### Redis keys and channels

| Name | Type | Purpose |
|------|------|---------|
| `presence:user:<id>:conns` | sorted set | One member per open socket (`connId`), scored by the time of its last ping |
| `presence:user:<id>` | pub/sub channel | `{"online":true}` or `{"online":false}` when the user's state changes |
| `friends:changed:<id>` | pub/sub channel | Sent by the user service when user `<id>`'s friend list changes |

The key and channel names are built in [presence.ts](../web/server/utils/presence.ts).

### Lua scripts

Both scripts live in [presence.ts](../web/server/utils/presence.ts):

- **Write script** (`connect`, `ping`, `disconnect`, `prune`). Each call:
  1. Reads `TIME` from Redis, so all web instances share one clock.
  2. Counts the set before pruning, and removes members older than 90 s.
  3. Applies the action.
  4. Publishes `online` only if the set went from empty to non-empty, and `offline` only if it went from non-empty to empty.
- **Snapshot script** (read-only, `EVAL_RO`). For each friend key, it runs `ZCOUNT` on the fresh window and returns the positions of the friends that have at least one fresh connection.

### Connection lifecycle

1. **Ticket:** the client calls `POST /api/presence/ws-ticket` ([ws-ticket.post.ts](../web/server/api/presence/ws-ticket.post.ts)). The ticket is a JWT with scope `presence` that expires after 15 s ([wsTicket.ts](../web/server/utils/wsTicket.ts)).
2. **Open:** the socket connects to `/ws/presence`. The server runs the steps below in this order:
   1. Start buffering messages for this socket.
   2. Fetch the friend list from the user service ([userService.ts](../web/server/utils/userService.ts)), and keep only accepted friends.
   3. Subscribe to each friend's channel. Subscriptions are shared per web instance, so each friend has one subscription regardless of how many sockets watch them.
   4. Run `connect`.
   5. Read the snapshot and send it.
   6. Send the buffered messages, then pass live messages through.
3. **Heartbeat:** the client sends `{"type":"ping"}` every 30 s. The server runs `ping`, which refreshes the connection's score.
4. **Refresh:** the client sends `{"type":"snapshot"}` every 60 s. The server runs the same steps as on open.
5. **Close:** the server runs `disconnect`, then releases the friend subscriptions and the `friends:changed` subscription.
6. **Crash or dead network:** no `disconnect` runs. The connection expires after 90 s. Each web instance that watches a friend runs `prune` every 30 s, which publishes `offline` once the last connection expires.

### Friend changes

The user service publishes to `friends:changed:<id>` for both users involved, after the database change succeeds. The helper is `publishFriendsChanged` in [redis.ts](../services/user/server/utils/redis.ts). It is called from:

- [accept.post.ts](../services/user/server/routes/friends/accept.post.ts)
- [remove.post.ts](../services/user/server/routes/friends/remove.post.ts)
- [block.post.ts](../services/user/server/routes/blocks/block.post.ts)

On that event, the web service re-runs the snapshot steps for each open socket of that user. This re-reads the friend list and updates the friend subscriptions, so removed friends stop sending updates.

**Why only these three routes:** the presence set only contains accepted friends. Adding and declining a request only touch pending requests, and unblocking doesn't restore a friendship. Publishing from those routes would cost a Redis message without changing anything.

### Client

- [usePresence.ts](../web/app/composables/usePresence.ts) owns the socket. It replaces its online list on each snapshot, applies `presence` messages one friend at a time, and reconnects with a backoff from 1 s up to 30 s.
- [default.vue](../web/app/layouts/default.vue) starts the connection when the user is logged in and stops it on logout. The layout is used by every page, so the connection survives navigation.
- [UserList.vue](../web/app/components/Custom/UserList.vue) shows the green dot for each user in `onlineIds`.

## Message formats

Server to client:

```json
{"type":"snapshot","online":["12","15"]}
{"type":"presence","userId":"12","online":true}
```

Client to server:

```json
{"type":"ping"}
{"type":"snapshot"}
```

A `snapshot` replaces the whole online list. A `presence` message adds or removes one friend.

## Timing

| Value | Where | Purpose |
|-------|-------|---------|
| 30 s | Client ping interval | Keeps the connection fresh |
| 90 s | Liveness window | A connection without a ping in the last 90 s counts as gone |
| 180 s | Redis key `PEXPIRE` | Cleanup for idle keys. Always longer than the window |
| 60 s | Client snapshot refresh | Corrects any missed pub/sub message |
| 30 s | `prune` interval per watched friend, per web instance | Publishes `offline` for expired connections |
| 15 s | Ticket lifetime | Only needs to cover the socket handshake |

The 90 s window is the real expiry. Redis can't expire individual members of a sorted set, so the scripts remove members whose score is older than `now - 90000`. Chrome can throttle timers in background tabs to about one tick per minute. With a 30 s ping and a 90 s window, a hidden tab still stays online.

The values live in [presence.ts](../web/server/utils/presence.ts).

## Files

**Web service**

- [presence.ts](../web/server/utils/presence.ts): constants, Lua scripts, `runPresence`, `getOnlineFriends`
- [routes/ws/presence.ts](../web/server/routes/ws/presence.ts): WebSocket handler, friend subscriptions, snapshots, buffering
- [ws-ticket.post.ts](../web/server/api/presence/ws-ticket.post.ts): ticket endpoint
- [wsTicket.ts](../web/server/utils/wsTicket.ts): `presence` scope
- [chat.ts](../web/server/routes/ws/chat.ts): the pattern the presence route follows

**User service**

- [redis.ts](../services/user/server/utils/redis.ts): `publishFriendsChanged`
- [accept.post.ts](../services/user/server/routes/friends/accept.post.ts), [remove.post.ts](../services/user/server/routes/friends/remove.post.ts), [block.post.ts](../services/user/server/routes/blocks/block.post.ts): publish calls

**Client**

- [usePresence.ts](../web/app/composables/usePresence.ts): connection and online list
- [default.vue](../web/app/layouts/default.vue): start and stop on login and logout
- [UserList.vue](../web/app/components/Custom/UserList.vue): green dot

## Design decisions

- **Buffering before the snapshot:** without it, an `offline` that arrives between reading the snapshot and sending it would be overwritten by the stale snapshot. Messages carry full state, so replaying a duplicate is harmless.
- **Snapshots replace, not merge:** a snapshot always corrects the client's state.
- **Ticket per connection:** tickets are short-lived and only used for the handshake.
- **One subscription per friend per instance:** a friend watched by many sockets costs one Redis subscription and one prune timer.

## Known limitations

- **Dead tabs show as online for up to 90 s.** This is the price of tolerating background-tab throttling.
- **Pub/sub is fire-and-forget.** A missed message is corrected by the 60 s snapshot refresh.
- **Failed publish:** if Redis is unavailable when a friend change is published, the change still applies, but open sockets only catch up at their next snapshot refresh (up to 60 s later).
- **Unblocking doesn't restore the friendship.** It has to be re-requested.

## Testing

### Checking Redis

Redis is not exposed on a host port in [docker-compose.yml](../docker-compose.yml), so run the commands through the container:

```bash
docker compose exec redis redis-cli ZRANGE presence:user:<id>:conns 0 -1 WITHSCORES
docker compose exec redis redis-cli PUBSUB NUMSUB presence:user:<id>
docker compose exec redis redis-cli SUBSCRIBE friends:changed:<id>
```

### Manual checklist

Use two accounts that are accepted friends, in two browser profiles.

- [ ] Logged-out `POST /api/presence/ws-ticket` returns 401
- [ ] A presence ticket is rejected by `/ws/chat` (403)
- [ ] An expired ticket is rejected (401)
- [ ] Opening `/ws/presence` sends a snapshot with the current online friends
- [ ] A friend going online and offline sends a `presence` message
- [ ] Multiple tabs for one user keep `PUBSUB NUMSUB` at 1 per watching instance
- [ ] Closing the last tab sends `offline`
- [ ] A background tab stays online
- [ ] A dead tab (network cut, no close) shows offline within about 90 s
- [ ] Accepting a friend request shows their status without a reload
- [ ] Removing a friend stops their updates
- [ ] Blocking a user stops updates in both directions
- [ ] Unblocking does not restore the friendship
- [ ] With Redis stopped, a friend change still succeeds and logs `Failed to publish friends:changed`
- [ ] With the user service stopped, opening the socket closes it, and no connection entry is left in `presence:user:<id>:conns`
- [ ] Logging out clears the green dots
- [ ] Web type check passes: `npx tsc -p .nuxt/tsconfig.server.json --noEmit`
