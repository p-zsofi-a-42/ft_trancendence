import { defineHandler, getRequestHeader, readValidatedBody, createError } from "h3";
import z from "zod";
import { eq } from "drizzle-orm"
import { client, connection } from "@utils/redis";
import { db, games, companies } from "@utils/db";

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

	const [game] = await db
		.select({ id: games.id })
		.from(games)
		.where(eq(games.idCode, body.gameCode));
	if (!game.id)
		throw Error(`game code does not exist (${game.idCode})`);
	// TODO: check if the game is already full
	const [row] = await db
		.insert(companies)
		.values({ name: body.name, gameId: game.id, userId: userId })
		.onConflictDoNothing({ target: [companies.gameId, companies.userId] })
		.returning();
	if (!row)
		throw createError({statusCode: 409, statusMessage: "already joined"});
	// publish the new company to the game session channel
	await connection;
	await client.publish(`game:session:${body.gameCode}`, JSON.stringify({ type: "joined", company: row }));
	return (row);
});
