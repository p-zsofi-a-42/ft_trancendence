# How the feature works
**Presence state, per user**: a Redis sorted set `presence:user:<id>:conns`. Each member is one open browser socket (a `connId`, a UUID). Its score is the time of its last ping. A user is online when at least one member is fresh.

**Transitions go through one Lua script**. Each action (`connect`, `ping`, `disconnect`, `prune`) runs atomically:

1. Remove members older than `now - 90s`.
2. Record whether the set was non-empty.
3. Apply the change.
4.  Publish `online` or `offline` on `presence:user:<id>` only if the online state changed.

Time comes from Redis `TIME`, so all web instances share one clock.

**Lifecycle**:

* **Connect**: the client opens `/ws/presence` with a 15 s ticket. The server subscribes to each accepted friend's channel first, then buffers incoming messages, runs connect, sends the snapshot, and flushes the buffer.
* **Heartbeat**: every 30 s the client sends `ping`, which refreshes its score. If the set had expired while the socket stayed open, `ping` republishes `online`.
* **Disconnect**: a normal close runs `disconnect` (`ZREM`). Friends see `offline` right away if it was the last socket.
* **Crash or dead network**: no `disconnect` runs. The entry expires after 90 s. Each web instance that watches a friend runs `prune` every 30 s, which publishes `offline` for that expiry.

**TTL**: the 90 s window is the real expiry. Sorted-set members can't expire one by one, so the script trims them by score. The Redis key `PEXPIRE` is 180 s (2× the window). It's only cleanup for idle keys and never removes a live connection. Why 90 s: background tabs can be throttled to about one timer tick per minute, so a 30 s ping with a 90 s window keeps them online.

**Snapshots**: pub/sub only carries changes, so a new socket needs the current state. One read-only script runs `ZCOUNT key (now-90000) +inf` for each friend and returns the online IDs, e.g. `{"type":"snapshot","online":["12","15"]}`. The client replaces its whole online set on each snapshot, which corrects stale state. The client also requests one every 60 s. The ordering matters: subscribe, then buffer, then `connect`, then snapshot, then flush. Otherwise an `offline` that arrives between the snapshot read and the send would be overwritten by the stale snapshot. Messages carry the full state, so replaying one is harmless.

## Files to change
* New `web/server/utils/presence.ts` (timings, Lua scripts), `web/server/routes/ws/presence.ts`, and `POST /api/presence/ws-ticket`, modeled on `chat.ts` and `chats/[id]/ws-ticket.post.ts`.
* `wsTicket.ts`: add the presence scope.
* User service: publish `friends:changed` from the friend and block routes, e.g. *`accept.post.ts`*.
* Client: a `usePresence` composable, started from *`default.vue`* when logged in, and a dot in *`FriendList.vue`*.
* Docs: doc/ws-presence.md still has the old 25/60/120 s values. It's your untracked file, so I'd update it only with your OK. Also tick Online in TODO.md.
---

## TTL (Time To Live)

Design has three timing values, each does a different job:

| Value | Where it applies | Purpose |
|-------|------------------|---------|
| 25 s | Client ping interval | How often a tab says it's still alive |
| 60 s | Liveness window | A connection with no ping in the last 60 s counts as gone |
| 120 s | PEXPIRE on the Redis key | Cleans up an idle key. Not a presence rule |

* **The 60 s window is the real TTL**. Redis can't expire individual members of a sorted set, so the Lua script removes entries whose score is older than `now - 60000`. That's why the window is passed as an argument instead of set as a key TTL
* **The 120 s key expiry is only a safety net**. It stops a user who has been offline for a long time from leaving a key in Redis. It must be longer than the window so it never deletes a live connection. Each script call refreshes it
* **Why 60 s with a 25 s ping**: a tab can miss about two pings before it's marked offline.

**Problem with current numbers: browse throttle timers in background tabs. Chrome can delay them once a min after tab has been hidden.
**Better pair** is **30s ping with a 90s window**

## Snapshots
Pub/sub only sends changes. User opens page, client doesn't know current status of its friends, so *SERVER* sends **snapshot**: one message with the full online state of the user's friends.

How it works:

1. The client opens `/ws/presence`.
2. On open, the server subscribes to each friend's channel
3. The server gets the friend IDs from the user service, keeping only accepted friends.
4. The server runs one read-only Lua script that calls TIME and then `ZCOUNT key (now-60000) +inf` for each friend. This reads the same clock as the writes. Stale members are ignored without being deleted
5. The server sends {"type":"snapshot","online":["12","15"]}
6. The client **replaces** its whole online set with that array. Replacing, not merging, is what corrects any stale state
7. After that, `presence` messages update one friend at a time.

