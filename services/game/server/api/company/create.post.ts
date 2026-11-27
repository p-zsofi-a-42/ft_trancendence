import { defineHandler, getRequestHeader, readValidatedBody, createError } from "h3";
import z from "zod";
import { eq } from "drizzle-orm"
import { publish } from "@utils/redis";
import { db, games, companies } from "@utils/db";
import { HTTPError } from "nitro";

const validInput = z.strictObject({
	gameCode: z.string().min(6).max(12),
	name: z.string().max(20)
});

/*
 * Create a new company for a game, identified by its code
 */
export default defineHandler(async (event) => {
	const userId = z.coerce.bigint().min(1).parse(getRequestHeader(event, "user-id"));
	const body = await readValidatedBody(event, validInput.parse);
	let game, row = undefined;

	try {
		[game] = await db
			.select({ id: games.id })
			.from(games)
			.where(eq(games.idCode, body.gameCode));
	} catch (error: any) {
		console.log(`Error at /api/company/create.post: ${error.message}`);
		throw new HTTPError({ statusMessage: "failed to retrieve game", status: 500 });
	}
	if (!game)
		throw new HTTPError({ statusMessage: "game does not exist", status: 400 });
	// TODO: check if the game is already full

	try {
		[row] = await db
			.insert(companies)
			.values({ name: body.name, gameId: game.id, userId: userId })
			.onConflictDoNothing({ target: [companies.gameId, companies.userId] })
			.returning();
	} catch (error: any) {
		console.log(`Error at /api/company/create.get: ${error.message}`);
		throw new HTTPError({ statusMessage: "failed to create company", status: 500 });
	}
	if (!row)
		throw new HTTPError({ statusMessage: "already joined", status: 400 });
	// publish the new company to the game session channel
	await publish(`game:session:${body.gameCode}`,
		{
			type: "joined",
			company: row
		}
	);
	return (row);
});
