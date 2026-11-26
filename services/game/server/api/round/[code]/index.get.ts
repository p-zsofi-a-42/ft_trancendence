import { defineHandler, getValidatedRouterParams, getValidatedQuery } from "h3";
import { HTTPError } from "nitro";
import z from "zod";
import { and, desc, eq } from "drizzle-orm";
import { db, rounds } from "@utils/db";
import { codeParams, getGameByCode } from "@utils/game";

const query = z.object({ index: z.coerce.number().int().min(0).optional() });

export default defineHandler(async (event) => {
	const { code } = await getValidatedRouterParams(event, codeParams);
	const { index } = await getValidatedQuery(event, query);
	const game = await getGameByCode(code);

	const [round] = await db.select().from(rounds)
		.where(index === undefined
			? eq(rounds.gameId, game.id)
			: and(eq(rounds.gameId, game.id), eq(rounds.index, index)))
		.orderBy(desc(rounds.index))
		.limit(1);
	if (!round)
		throw new HTTPError({ status: 404, statusMessage: "round not found" });

	return { round, serverNow: new Date().toISOString() };
});
