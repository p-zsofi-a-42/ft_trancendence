import { sql } from "drizzle-orm";
import { pgTable, bigint, text, varchar, unique, check } from "drizzle-orm/pg-core";
import { games } from "@db/schema/games";

export const companies = pgTable("companies", {
	id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
	gameId: bigint("game_id", { mode: "number" }).references(() => games.id),
	userId: bigint("user_id", { mode: "number" }).notNull(),
	name: text("name"),
	color: text("color").notNull().default("#000000"),
}, (t) => [
	unique("unique_game_user").on(t.gameId, t.userId),
	check("check_color", sql`${t.color} ~ '^#[0-9A-Fa-f]{6}$'`),
]);
