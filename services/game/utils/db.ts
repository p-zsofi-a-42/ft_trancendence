import { drizzle } from "drizzle-orm/node-postgres";
import { games } from "@db/schema/games"
import { companies } from "@db/schema/companies"

export const db = drizzle(process.env.DATABASE_URL!);

export { games, companies };

export type Game = typeof games.$inferSelect;
