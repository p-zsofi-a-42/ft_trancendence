import { drizzle } from "drizzle-orm/node-postgres";
import { games } from "@db/schema/games";
import { companies } from "@db/schema/companies";
import { rounds } from "@db/schema/rounds";
import { roundResults } from "@db/schema/roundResults";

export const db = drizzle(process.env.DATABASE_URL!);

export { games, companies, rounds, roundResults };

export type Game = typeof games.$inferSelect;
export type Company = typeof companies.$inferSelect;
export type Round = typeof rounds.$inferSelect;
export type RoundResult = typeof roundResults.$inferSelect;
