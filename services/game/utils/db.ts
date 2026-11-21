import { drizzle } from "drizzle-orm/node-postgres";
import { games } from "@db/schema/games";
import { companies } from "@db/schema/companies";
import { rounds } from "@db/schema/rounds";
import { roundResults } from "@db/schema/roundResults";

export const db = drizzle(process.env.DATABASE_URL!);

export { games, companies, rounds, roundResults };

export type Game = typeof games.$inferSelect;
