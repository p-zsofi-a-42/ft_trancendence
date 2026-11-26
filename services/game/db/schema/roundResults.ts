import { sql } from "drizzle-orm";
import { pgTable, bigint, smallint, boolean, timestamp, check, unique, index } from "drizzle-orm/pg-core";
import { games } from "@db/schema/games";
import { rounds } from "@db/schema/rounds";
import { companies } from "@db/schema/companies";

export const roundResults = pgTable("round_results", {
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
	gameId: bigint("game_id", { mode: "number" }).notNull().references(() => games.id),
	roundId: bigint("round_id", { mode: "number" }).notNull().references(() => rounds.id),
	companyId: bigint("company_id", { mode: "number" }).notNull().references(() => companies.id),
	capital: bigint("capital", { mode: "number" }).notNull(),
	customers: smallint("customers").notNull(),
	quality: smallint("quality").notNull(),
	nDevelopers: smallint("n_developers").notNull(),
	nSalespeople: smallint("n_salespeople").notNull(),
	price: bigint("price", { mode: "number" }).notNull(),
	ownership: smallint("ownership").notNull(),
	locked: boolean("locked").notNull().default(false),
	lockedAt: timestamp("locked_at"),
}, (t) => [
	check("check_customers", sql`${t.customers} >= 0`),
	check("check_quality", sql`${t.quality} >= 0`),
	check("check_n_developers", sql`${t.nDevelopers} >= 0`),
	check("check_n_salespeople", sql`${t.nSalespeople} >= 0`),
	check("check_price", sql`${t.price} >= 0`),
	check("check_ownership", sql`${t.ownership} BETWEEN 0 AND 100`),
	unique("unique_round_company").on(t.roundId, t.companyId),
	index("index_round_results_game").on(t.gameId),
	index("index_round_results_company").on(t.companyId)
]);
