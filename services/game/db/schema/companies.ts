import { pgTable, bigint, text, smallint, timestamp } from "drizzle-orm/pg-core";
import { games } from "@db/schema/games";

export const companies = pgTable("companies", {
  id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
	gameId: bigint("game_id", {mode: "number"}).references(() => games.id),
	userId: bigint("user_id", { mode: "number" }).notNull(),
  name: text("name"),
});
