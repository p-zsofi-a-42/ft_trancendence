
-- -----------------------------------------------------------------------------
-- USERS -----------------------------------------------------------------------
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- FRIENDSHIPS -----------------------------------------------------------------
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS friendships (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  requester_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  addressee_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'accepted')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (requester_id <> addressee_id)
);

-- A pair of users can only have one row, whichever direction it was sent in
CREATE UNIQUE INDEX IF NOT EXISTS friendships_pair_key
  ON friendships (LEAST(requester_id, addressee_id), GREATEST(requester_id, addressee_id));

CREATE INDEX IF NOT EXISTS friendships_addressee_idx ON friendships (addressee_id, status);
CREATE INDEX IF NOT EXISTS friendships_requester_idx ON friendships (requester_id, status);


-- -----------------------------------------------------------------------------
-- BLOCK USERS -----------------------------------------------------------------
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS blocks (
  blocker_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

CREATE INDEX IF NOT EXISTS blocks_blocked_idx ON blocks (blocked_id, blocker_id);

-- -----------------------------------------------------------------------------
-- -----------------------------------------------------------------------------
-- CHATS -----------------------------------------------------------------------
-- -----------------------------------------------------------------------------
-- Direct conversation between two friends. One row per pair of users.
CREATE TABLE IF NOT EXISTS conversations (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_a_id  BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b_id  BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (user_a_id < user_b_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS conversations_pair_key ON conversations (user_a_id, user_b_id);
CREATE INDEX IF NOT EXISTS conversations_user_b_idx ON conversations (user_b_id);

-- Messages. Newest first is the common read pattern.
CREATE TABLE IF NOT EXISTS messages (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body            TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  client_id       UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_conversation_idx ON messages (conversation_id, id DESC);
-- Retries from the same client don't create duplicate messages
CREATE UNIQUE INDEX IF NOT EXISTS messages_client_key ON messages (sender_id, client_id) WHERE client_id IS NOT NULL;

-- Per-user read position, used for unread counts
CREATE TABLE IF NOT EXISTS conversation_reads (
  conversation_id      BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id              BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_read_message_id BIGINT REFERENCES messages(id) ON DELETE SET NULL,
  PRIMARY KEY (conversation_id, user_id)
);



-- RUN THE SCHEMA SQL FILE
-- docker compose exec -T postgres psql -U <db_user> -d <db_name< < db/schema.sql
