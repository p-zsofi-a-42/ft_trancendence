-- Users table for dbproj. Safe to run repeatedly.
CREATE TABLE IF NOT EXISTS users (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Friend requests and friendships. One row per pair of users.
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

-- docker compose exec -T postgres psql -U <db_user> -d <db_name< < db/schema.sql
