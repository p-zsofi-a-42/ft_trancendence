import { eq, and } from "drizzle-orm";
import { HTTPError } from "nitro";
import z from "zod";
import { db, games } from "@utils/db";

export const codeParams = z.object({ code: z.string().min(6).max(12) });
export const idParams = z.object({ id: z.coerce.number().int().min(1).max(Number .MAX_SAFE_INTEGER) });

export async function getGameByCode(code: string) {
	const [game] = await db.select().from(games).where(eq(games.idCode, code));
	if (!game)
		throw new HTTPError({ status: 404, statusMessage: "game not found" });
	return game;
}

export async function getGameById(id: number, creatorId?: number) {
	const [game] = await db.select().from(games)
		.where(
			creatorId !== undefined
				? and(eq(games.id, id), eq(games.creatorId, creatorId))
				: eq(games.id, id)
		);
	if (!game)
		throw new HTTPError({ status: 404, statusMessage: "game not found" });
	return game;
}
