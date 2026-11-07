import { pgTable, bigint, text, smallint, timestamp } from "drizzle-orm/pg-core";


// CREATE TABLE IF NOT EXISTS games (
//   id						BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, -- TODO: ?
//   id_code				TEXT NOT NULL UNIQUE,
//   n_players			SMALLINT NOT NULL CHECK (n_players BETWEEN 2 AND 5),
//   n_rounds			SMALLINT NOT NULL,
// 	current_round	SMALLINT NOT NULL DEFAULT 0,
// 	seed_capital	BIGINT NOT NULL,
// 	creator_id		BIGINT NOT NULL, -- points to a user in the users db
//   created_at		TIMESTAMPTZ NOT NULL DEFAULT now()
// );

export const games = pgTable("games", {
  id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  id_code: text().notNull().unique(),
	n_players: smallint().notNull(),
	n_rounds: smallint().notNull(),
	current_round: smallint().notNull().default(0),
	seed_capital: bigint({ mode: "number" }).notNull(),
	creator_id: bigint({ mode: "number" }).notNull(),
	created_at: timestamp().notNull().defaultNow(),
});
