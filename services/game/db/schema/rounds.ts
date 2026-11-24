import { sql } from "drizzle-orm";
import { pgTable, bigint, smallint, pgEnum, timestamp, check, unique, index } from "drizzle-orm/pg-core";
import { games } from "@db/schema/games";

export const roundStatusEnum = pgEnum("status", ["ongoing", "paused", "done"]);

export const rounds = pgTable("rounds", {
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
	gameId: bigint("game_id", { mode: "number" }).references(() => games.id),
	index: smallint().notNull(),
	endsAt: timestamp("ends_at").notNull(),
	status: roundStatusEnum().notNull().default("ongoing"),
}, (t) => [
	check("check_index", sql`${t.index} >= 0`),
	unique("unique_round_index").on(t.gameId, t.index),
	index("index_rounds_due").on(t.endsAt).where(sql`${t.status} = 'ongoing'`)
]);
