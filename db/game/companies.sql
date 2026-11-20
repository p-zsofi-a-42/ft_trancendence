CREATE TABLE IF NOT EXISTS companies (
  id			BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	game_id	BIGINT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id	BIGINT NOT NULL, -- points to a user in the users db
	name		TEXT,
	color		TEXT NOT NULL DEFAULT '#000000' CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
	created_at	TIMESTAMPTZ NOT NULL DEFAULT now(),

	CONSTRAINT unique_game_user UNIQUE (game_id, user_id)
);

