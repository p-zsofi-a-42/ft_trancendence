CREATE TABLE IF NOT EXISTS companies (
  id			BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	game_id	BIGINT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id	BIGINT NOT NULL, -- points to a user in the users db
	name		TEXT
);

