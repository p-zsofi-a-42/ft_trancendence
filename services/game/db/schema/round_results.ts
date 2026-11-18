// NOT EXISTS round_results (
// 	id						BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
// 	game_id				BIGINT NOT NULL REFERENCES games(id),
// 	round_id			BIGINT NOT NULL REFERENCES rounds(id),
// 	company_id		BIGINT NOT NULL REFERENCES companies(id),
// 	capital				BIGINT NOT NULL,
// 	customers			INTEGER NOT NULL CHECK (customers >= 0),
// 	quality				SMALLINT NOT NULL CHECK (quality >= 0),
// 	n_developers	SMALLINT NOT NULL CHECK (n_developers >= 0),
// 	n_salespeople	SMALLINT NOT NULL CHECK (n_salespeople >= 0),
// 	price					BIGINT NOT NULL CHECK (price >= 0),
// 	ownership			SMALLINT NOT NULL CHECK (ownership BETWEEN 0 AND 100),
// 	locked				BOOLEAN NOT NULL DEFAULT false,
// 	UNIQUE (round_id, company_id)
// );
//
// CREATE INDEX IF NOT EXISTS idx_round_results_game ON round_results (game_id);
// CREATE INDEX IF NOT EXISTS idx_round_results_company ON round_results (company_id);
import { sql } from "drizzle-orm";
import { pgTable, bigint, smallint, check, timestamp, index } from "drizzle-orm/pg-core";
import { games } from "@db/schema/games";
import { rounds } from "@db/schema/rounds";
import { companies } from "@db/schema/comapnies";

export const round_results = pgTable("round_results", {
  id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
	gameId: bigint("game_id", {mode: "number"}).references(() => games.id),
	roundId: bigint("round_id", {mode: "number"}).references(() => rounds.id),
	companyId: bigint("company_id", {mode: "number"}).references(() => comapnies.id),
	capital: bigint("capital", {mode: "number"}).notNull(),
	customers: smallint("customers").notNull(),
	quality: smallint("quality").notNull(),
	n_developers: smallint("n_developers").notNull(),
	n_salespeople: smallint("n_salespeople").notNull(),
	price: bigint("price", {mode: "number"}).notNull(),
	ownership: smallint("ownership").notNull(),
	locked: boolean("locked").notNull().default(false),
}, (t) => [
	check("check_customers", sql`${t.customers} >= 0`),
	check("check_quality", sql`${t.customers} >= 0`),
	check("check_n_developers", sql`${t.n_developers} >= 0`),
	check("check_n_salespeople", sql`${t.n_salespeople} >= 0`),
	check("check_price", sql`${t.price} >= 0`),
	check("check_ownership", sql`${t.price} BETWEEN 0 AND 100`),
	unique("unique_round_company").on(t.roundId, t.companyId),
	index("index_round_results_game").on(t.gameId),
	index("index_round_results_company").on(t.companyId)
]);
