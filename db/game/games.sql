CREATE TABLE IF NOT EXISTS games (
  id						BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_code				TEXT NOT NULL UNIQUE,
  n_rounds			SMALLINT NOT NULL,
	current_round	SMALLINT NOT NULL,
	seed_capital	BIGINT NOT NULL,
	creator_id		BIGINT NOT NULL, -- points to a user in the users db
  created_at		TIMESTAMPTZ NOT NULL DEFAULT now()
);
