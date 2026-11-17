# Online presence diagrams

## 1. Architecture

```mermaid
flowchart LR
  subgraph Browser
    A[Tab A<br/>usePresence]
    B[Tab B<br/>usePresence]
  end
  subgraph Web["Web service (Nitro)"]
    WS1[WS /ws/presence<br/>instance 1]
    WS2[WS /ws/presence<br/>instance 2]
  end
  R[(Redis<br/>sorted sets + pub/sub)]
  US[User service<br/>friends + blocks]

  A <-->|ticket + ping| WS1
  B <-->|ticket + ping| WS2
  WS1 -- "EVAL lua / snapshot" --> R
  WS2 -- "EVAL lua / snapshot" --> R
  R -- "presence:user:<id>" --> WS1
  R -- "presence:user:<id>" --> WS2
  US -- "friends:changed:<id>" --> R
  WS1 -- "GET friends (once, cached)" --> US
```

Redis holds the state. Each web instance subscribes to its sockets' friends' channels. The user service only publishes `friends:changed`.

## 2. Socket lifecycle

```mermaid
sequenceDiagram
  autonumber
  participant C as Browser (usePresence)
  participant W as Web WS /ws/presence
  participant R as Redis
  participant U as User service

  C->>W: open ?ticket=... (15 s JWT)
  W->>W: verify ticket, scope = presence
  W->>U: GET /friends (accepted IDs, cached per socket)
  W->>R: SUBSCRIBE presence:user:<friendId> (refcounted, awaited)
  Note over W: start buffering friend messages for this socket
  W->>R: EVAL connect(connId, now)
  R-->>R: ZREMRANGEBYSCORE old, ZADD connId now, PEXPIRE 180s
  R-->>W: PUBLISH online (only if set was empty)
  W->>R: snapshot script (TIME + ZCOUNT per friend)
  R-->>W: online friend IDs
  W-->>C: snapshot with online friend IDs
  W-->>C: flush buffered messages, then live

  loop every 30 s
    C->>W: ping
    W->>R: EVAL ping(connId, now)
  end

  alt tab closed normally
    C-->>W: close
    W->>R: EVAL disconnect(connId)
    W->>R: UNSUBSCRIBE when refcount = 0
  else tab crashed / network dead
    Note over W,R: no disconnect runs. The entry expires after 90 s.
  end
```

## 3. The atomic Lua transition

```mermaid
flowchart TD
  S([EVAL action, connId, now]) --> P["Remove members with score below now minus 90000"]
  P --> W{"wasOnline = ZCARD above 0 before action?"}
  W --> D{action}
  D -->|connect / ping| U1[ZADD connId now]
  D -->|disconnect| U2[ZREM connId]
  D -->|prune| U3[no change]
  U1 --> E
  U2 --> E
  U3 --> E
  E[PEXPIRE key 180 s] --> N{"isOnline = ZCARD above 0 after?"}
  N -->|false to true| PUB1[PUBLISH online]
  N -->|true to false| PUB2[PUBLISH offline]
  N -->|no change| NONE[no publish]
```

The publish happens only on an edge. `prune` on an already-empty key does nothing, which avoids repeated `offline` messages.

## 4. What a crashed tab looks like over time

```text
time   0s        30s        60s      (crash)    120s       150s     180s
tab    connect   ping       ping       - - - -
score                                  60 (last ping)
friends view  online ---------------------------------------- online --> offline
                                                     ^ expired at 150 s
                                             prune tick (every 30 s) publishes offline
                                                                              between 150 and 180 s
```

A tab that closes normally goes offline at once through `disconnect`. A crashed tab goes offline after 90 s, plus at most one prune tick.

## 5. Snapshot vs live updates

```mermaid
flowchart LR
  subgraph Initial and refresh
    SN[Snapshot script<br/>read-only] --> MSG1["type: snapshot<br/>online: friend IDs"]
  end
  subgraph Live
    PS[PUBLISH presence:user:12<br/>online: false] --> MSG2["type: presence<br/>userId and online"]
  end
  MSG1 --> SET[Client replaces<br/>its whole online set]
  MSG2 --> UPD[Client updates<br/>one friend]
```

The snapshot replaces the set, which corrects stale state. Live messages change one friend at a time. The buffer in step 2 of the lifecycle keeps the snapshot from overwriting a newer live message.
