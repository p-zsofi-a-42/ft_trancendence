# Plan (friends-only, online/offline)

## Codebase findings
- The web service's `chat.ts` keeps one Redis subscription per conversation, refcounted by local sockets. Presence can use the same pattern.
- Friend lists come from the user service, and `friends/index.get.ts` already excludes blocked users.
- There is no presence data and no user-level WebSocket yet.

## Changes

* ### Web service
	* `web/server/utils/presence.ts` (new): timing constants, the atomic Lua script (actions: connect, ping, disconnect, prune), and the read-only snapshot script.
	* `wsTicket.ts`: add a presence scope.
	* `POST /api/presence/ws-ticket` (new): mints a ticket, like the chat route.
	* `web/server/routes/ws/presence.ts` (new): on open, subscribe to friend channels with refcounts, buffer their messages, run `connect`, then send the snapshot and flush the buffer (see Snapshots). On `ping`, run the `ping` action. On a `snapshot` request, repeat the snapshot step. On close, run `disconnect` and unsubscribe friend channels whose refcount reaches zero.

* ### User service
	* Publish `friends:changed:<userId>` on add, accept, decline, remove, block, and unblock. Without this, the web service's friend subscriptions go stale.

* ### Client
	* `usePresence` composable (new): connects with a ticket, pings every 30s, reconnects with backoff, replaces its online set on each snapshot, and requests a new snapshot every 60s.
	* Start it in **default.vue** when logged in, and stop it on logout.
	* Show a green dot for online friends in **UserList.vue.**

## Timing

| Value | Purpose |
|-------|---------|
| 30 s | Client ping interval |
| 90 s | Liveness window. A connection with no ping in the last 90 s counts as gone |
| 180 s | `PEXPIRE` on the Redis key. Always 2x the window, so it never removes a live connection |
| 60 s | Client snapshot refresh |
| 30 s | `prune` interval on the web instance, per watched friend |

- The 90 s window is the real TTL. Sorted-set members can't expire individually, so the script removes entries with a score below `now - 90000`.
- Why 90 s: browsers throttle timers in background tabs. Chrome can delay them to about once a minute after a tab has been hidden for a while. With a 30 s ping and a 90 s window, a throttled tab still stays online.
- Trade-off: a crashed or disconnected tab shows as offline up to 90 s later.

## Lua script actions

Each action first removes expired members, then records whether the set was non-empty, applies its change, and publishes only if the online state changed.

| Action | Change | Publishes |
|--------|--------|-----------|
| `connect` | `ZADD connId now` | `online` if the set was empty |
| `ping` | `ZADD connId now` (refresh) | `online` if the set was empty. Repairs a connection that expired while its socket stayed open |
| `disconnect` | `ZREM connId` | `offline` if the set is now empty |
| `prune` | none (expiry only) | `offline` if the set is now empty |

`prune` publishes a transition even when no socket calls the script. Two instances may prune the same user at the same time. The atomic script ensures only one of them publishes.

## Snapshots

A snapshot is the full online state of the user's friends in one message. Pub/sub only carries changes, so the snapshot provides the starting state on open and on each refresh.

**Snapshot read:** one read-only script calls `TIME` and runs `ZCOUNT key (now-90000) +inf` for each friend. It writes nothing and uses Redis's clock, the same clock as the writes. Expired members are ignored without being deleted.

**Order on open, per socket:**
1. Subscribe to each friend's channel (refcounted).
2. Start buffering pub/sub messages for this socket.
3. Run `connect`.
4. Read the snapshot and send `{"type":"snapshot","online":["12","15"]}`.
5. Send the buffered messages in order, then pass live messages through.

**Why buffer:** without it, the client can end up wrong. The snapshot reads a friend as online, the friend goes offline, and `offline` reaches the socket before the snapshot is sent. The snapshot then overwrites the correct state with the stale one. Messages carry full state (`{"online":true|false}`), so replaying a duplicate is harmless. The web server adds `userId` when forwarding, since the channel name is the only place it's stored.

**Refresh:** every 60 s the client sends `{"type":"snapshot"}`. The server repeats steps 2 to 5 on the same socket and re-reads the friend list, which also updates the subscriptions. The client replaces its online set on every snapshot, so stale entries are corrected.

## Known limitation

If a web instance crashes, its connections expire by TTL without publishing `offline`. The `prune` action fixes the pushes: each instance that watches a friend runs `prune` every 30 s, so the last expired connection publishes `offline`. Pub/sub is fire-and-forget, so the 60 s snapshot refresh is the backstop for any missed message.

## Validation

* Type check and lint for `web` and `services/user`.
* Manual test with two browsers and two friends: snapshot on load, online/offline pushes, multi-tab behavior, and status cleared after unfriending or blocking.
* Background tab: hide a tab for several minutes and confirm the friend still sees it online.
* Dead tab: cut the network of a tab without closing it. Friends should show it offline within about 90 s.
* Snapshot race: publish `offline` while a snapshot is being built and confirm the final state is offline.
* Check Redis with `redis-cli`: `ZRANGE presence:user:<id>:conns 0 -1 WITHSCORES`.
* Add unit tests for the transition logic only if the services already have a test runner. I didn't find one for the web service.
* Document the feature in `doc/ws-presence.md` and tick the `Online` item in TODO.md. That file currently states the old 25 s / 60 s / 120 s values, so update it to 30 s / 90 s / 180 s when implementing.