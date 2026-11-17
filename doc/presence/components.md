# Components

---
## 1. Redis sorted set `presence:user:<id>:conns`

* Each member is one open browser socket, identified by a connection ID (UUID).
* Each score is that socket's last ping time in milliseconds.
* A user is online if at least one member's score is within the last 90 s.
* Several tabs mean several members, so closing one tab doesn't make the user offline while another tab is still open.

### `presence:user:<id>:conns`
* `<id>` -> user's own ID (`userId`)
* Each user gets one *sorted set* (members are **that** user's open sockets).

Example, user 12 has two tabs open:
```
presence:user:12:conns
  member: conn-a1f...  score: 1763380500123
  member: conn-b7c...  score: 1763380530456
```

**`pub/sub`** channel uses the same ID but a different key, `presence:user:12` -> wher `online` & `offline` messages are published.

- `presence:user:12:conns` **is a real key, but only while user 12 has an open socket**. When the last member is removed, Redis deletes the empty set. The TTL does the same if pings stop.

*real key: Redis stores in memory under a name, can inspect it*
	*Commands like `EXISTS`, `TYPE` and `ZRANGE WITHSCORES`*
```
127.0.0.1:6379> TYPE presence:user:12:conns
zset
127.0.0.1:6379> ZRANGE presence:user:12:conns 0 -1 WITHSCORES
1) "conn-a1f..."
2) "1763380500123"
```

Redis creates and removes the key automatically:
- **Created**: the first ZADD in the connect action creates the key if it doesn't exist.
- **Updated**: ping runs ZADD to refresh a socket's score, and prune runs ZREMRANGEBYSCORE to drop stale sockets.
- **Deleted**: when the last member is removed, Redis deletes the empty set. The PEXPIRE of 180 s deletes it if nothing has touched it.

**Where this happens in the design:** nothing else in the codebase touches the key. The planned code lives in the web service, not in the user service:

- **Writers**: only the Lua script, run with `EVAL` from the presence WebSocket route in `web/server/routes/ws/`. The route calls it on socket open (`connect`), on each client ping (`ping`), on close (`disconnect`), and from a 30 s timer in the same process (`prune`).
- **Reader**: the read-only snapshot script, which counts members with `ZCOUNT` to check whether a friend is online.

---
- `presence:user:12` **is a pub/sub channel, not stored data**. Redis creates no key for it. It only delivers messages to whoever is subscribed at that moment. In practice, the web instances subscribe to the channels of the online user's friends, and the Lua script publishes to it on each online/offline change.

Example: **User13** logs in and *has Friendship* with **user12**.
- **User13** *`subscribes`* to `presence:user:12`
- **The subscription is per web instance, not per tab**. (user13 has 3 Tabs open, instance subscribes to `presence:user:12` once & shares among tabs)
- **Friendship is symmetric, so user12 also subscribes to presence:user:13**. Each user listens to their friends' channels.
- **Snapshots don't need a subscription**. user13 connects, snapshot script reads `presence:user:12:conns` directly & reports if user12 is online. (Subscriptions only carry changes after that)
- **Publishing doesn't depend on listeners.** Lua script publishes also if no one subscribed.


---
## 2. Lua script

* Redis runs the whole script as one atomic step, so the check and the change can't interleave with another request.
* It has four actions:
	* `connect` adds the socket. It publishes `online` if the set was empty before.
	* `ping` refreshes the socket's score. It publishes `online` if the set was empty, which repairs a user whose key already expired.
	* `disconnect` removes the socket. It publishes `offline` if the set is now empty.
	* `prune` removes sockets whose last ping is older than 90 s. It publishes `offline` only when the set goes from non-empty to empty.
* It uses Redis' `TIME` as the clock, so server clocks don't affect the result.
* It publishes only on a real state change, so friends don't get repeated messages.

---
## 3. TTL

* Each set gets `PEXPIRE` 180 s, refreshed on every action.
* It's a cleanup safety net. It deletes the key if nothing has touched it for 3 minutes, for example after a server crash.
* It is not what makes a user offline. The 90 s window does that.
* The TTL is twice the window, so a live socket with a slow ping is never deleted. Pings every 30 s keep the key fresh.

---
## 4. Snapshots

* The server sends a snapshot when a socket opens, and the client asks for one every 60 s.
* A read-only script checks each accepted friend's set and returns the IDs that are online.
* The client replaces its whole online list with the snapshot. This fixes anything missed through pub/sub, such as a lost message during a reconnect.
* Live messages that arrive while the snapshot is being built are held and applied after it. That stops an old snapshot from overwriting a newer `offline`.