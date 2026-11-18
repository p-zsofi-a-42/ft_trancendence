// CREATE TABLE IF NOT EXISTS rounds (
// 	id				BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
// 	game_id		BIGINT NOT NULL REFERENCES games(id),
// 	index			SMALLINT NOT NULL CHECK (index >= 1),
// 	ends_at		TIMESTAMPTZ NOT NULL,
// 	status		TEXT NOT NULL DEFAULT 'ongoing'
// 						CHECK (status IN ('ongoing', 'paused', 'done')),
// 	UNIQUE (game_id, index)
// );
//
// -- Index for the scheduled, to quickly find rounds to end
// CREATE INDEX IF NOT EXISTS idx_rounds_due
// 	ON rounds (ends_at) WHERE status = 'ongoing';
import { sql } from "drizzle-orm";
import { pgTable, bigint, smallint, pgEnum, check, timestamp, index } from "drizzle-orm/pg-core";
import { games } from "@db/schema/games";

export const roundStatusEnum = pgEnum("status", ["ongoing", "paused", "done"]);

export const rounds = pgTable("rounds", {
  id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
	gameId: bigint("game_id", {mode: "number"}).references(() => games.id),
  index: smallint().notNull(),
	endsAt: timestamp("ends_at").notNull(),
	status: roundStatusEnum().notNull().default("ongoing"),
}, (t) => [
	check("check_index", sql`${t.index} >= 0`),
	unique("unique_round_index").on(t.gameId, t.index),
	index("index_rounds_due").on(t.endsAt).where(sql`${t.status} = 'ongoing'`)
]);
