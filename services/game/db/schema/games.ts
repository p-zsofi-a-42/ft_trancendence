import { pgTable, bigint, text, smallint, pgEnum, timestamp } from "drizzle-orm/pg-core";

export const gameStatusEnum = pgEnum("status", ["created", "ongoing", "done"]);

export const games = pgTable("games", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  idCode: text("id_code").notNull().unique(),
	nPlayers: smallint("n_players").notNull(),
	nRounds: smallint("n_rounds").notNull(),
	currentRound: smallint("current_round").notNull().default(0),
	seedCapital: bigint("seed_capital", { mode: "number" }).notNull(),
	creatorId: bigint("creator_id", { mode: "number" }).notNull(),
	status: gameStatusEnum().notNull().default("created"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});
