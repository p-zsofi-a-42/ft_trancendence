import { eq } from "drizzle-orm";
import { HTTPError } from "nitro";
import z from "zod";
import { db, games } from "@utils/db";

export const codeParams = z.object({ code: z.string().min(6).max(12) });

export async function getGameByCode(code: string) {
	const [game] = await db.select().from(games).where(eq(games.idCode, code));
	if (!game)
		throw new HTTPError({ status: 404, statusMessage: "game not found" });
	return game;
}
