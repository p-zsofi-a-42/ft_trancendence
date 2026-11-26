CREATE TABLE IF NOT EXISTS round_results (
	id						BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	game_id				BIGINT NOT NULL REFERENCES games(id),
	round_id			BIGINT NOT NULL REFERENCES rounds(id),
	company_id		BIGINT NOT NULL REFERENCES companies(id),
	capital				BIGINT NOT NULL,
	customers			INTEGER NOT NULL CHECK (customers >= 0),
	quality				SMALLINT NOT NULL CHECK (quality >= 0),
	n_developers	SMALLINT NOT NULL CHECK (n_developers >= 0),
	n_salespeople	SMALLINT NOT NULL CHECK (n_salespeople >= 0),
	price					BIGINT NOT NULL CHECK (price >= 0),
	ownership			SMALLINT NOT NULL CHECK (ownership BETWEEN 0 AND 100),
	locked				BOOLEAN NOT NULL DEFAULT false,
	locked_at			TIMESTAMPTZ,
	UNIQUE (round_id, company_id)
);
-- TODO: add
-- 1. number of employees a player wants to hire
--

CREATE INDEX IF NOT EXISTS idx_round_results_game ON round_results (game_id);
CREATE INDEX IF NOT EXISTS idx_round_results_company ON round_results (company_id);
