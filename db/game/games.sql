CREATE TABLE IF NOT EXISTS games (
  id						BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_code				TEXT NOT NULL UNIQUE,
  n_players			SMALLINT NOT NULL CHECK (n_players BETWEEN 1 AND 5),
  n_rounds			SMALLINT NOT NULL,
	current_round	SMALLINT NOT NULL DEFAULT 0,
	seed_capital	BIGINT NOT NULL,
	creator_id		BIGINT NOT NULL, -- points to a user in the users db
  status				TEXT NOT NULL DEFAULT 'created'
								CHECK (status IN ('created', 'ongoing', 'done')),
  created_at		TIMESTAMPTZ NOT NULL DEFAULT now()
);

