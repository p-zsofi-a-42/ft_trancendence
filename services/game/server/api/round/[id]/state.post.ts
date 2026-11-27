import { defineHandler, getValidatedRouterParams } from "h3";
import { HTTPError } from "nitro";
import { and, eq, ne, sql } from "drizzle-orm";
import { db, rounds } from "@utils/db";
import { idParams, getGameById } from "@utils/game";
import { getUserId } from "@utils/user";

export default defineHandler(async (event) => {
	const { id } = await getValidatedRouterParams(event, idParams);
	const userId = getUserId(event);

	let [round] = await db.select().from(rounds)
		.where(and(eq(rounds.id, id), ne(rounds.status, "done")));
	if (!round)
		throw new HTTPError({ status: 404, statusMessage: "round not found" });
	// check game ownership
	const game = await getGameById(round.gameId, userId);
	[round] = await db.update(rounds)
		.set(round.status === "paused"
			? { status: "ongoing", endsAt: sql`now() + ${game.minutesPerRound} * interval '1 minute'` }
			: { status: "paused" })
		.where(eq(rounds.id, id))
		.returning();
	return { round, serverNow: new Date().toISOString() };
});

