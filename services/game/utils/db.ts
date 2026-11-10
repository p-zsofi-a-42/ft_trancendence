import { drizzle } from "drizzle-orm/node-postgres";
// import { games } from "../../db/schema/games";
import { games } from "@db/schema/games"

export const db = drizzle(process.env.DATABASE_URL!);
export { games };
