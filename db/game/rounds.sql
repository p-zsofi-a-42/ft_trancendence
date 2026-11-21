CREATE TABLE IF NOT EXISTS rounds (
	id				BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	game_id		BIGINT NOT NULL REFERENCES games(id),
	index			SMALLINT NOT NULL CHECK (index >= 0),
	ends_at		TIMESTAMPTZ NOT NULL,
	status		TEXT NOT NULL DEFAULT 'ongoing'
						CHECK (status IN ('ongoing', 'paused', 'done')),
	UNIQUE (game_id, index)
);

-- Index for the scheduled, to quickly find rounds to end
CREATE INDEX IF NOT EXISTS idx_rounds_due
	ON rounds (ends_at) WHERE status = 'ongoing';
