import { defineHandler, getRequestHeader, readValidatedBody, createError } from "h3";
import z from "zod";
import { eq } from "drizzle-orm"
import { client, connection } from "@utils/redis";
import { db, games, companies } from "@utils/db";

const validInput = z.strictObject({
	gameCode: z.string().min(6).max(12),
	name: z.string().min(1).max(20)
});

export default defineHandler(async (event) => {
	const userId = z.coerce.bigint().min(1).parse(getRequestHeader(event, "user-id"));
	const body = await readValidatedBody(event, validInput.parse);

	try {
		const [ game ] = await db
			.select({ id: games.id })
			.from(games)
			.where(eq(games.idCode, body.gameCode));
		if (!game.id)
			throw Error(`game code does not exist (${games.idCode})`);
		const [ row ] = await db
			.insert(companies)
			.values({ name: body.name, gameId: game.id, userId: userId })
			.returning();
		await updateCompaniesList(game.id);
		return (row);
	} catch (error) {
		console.log(`Error at /api/company/create.post: ${error.message}`);
		throw createError({
			statusCode: 500,
			statusMessage: "Company creation failed"
		});
	}
});

async function updateCompaniesList(gameId) {
	const compList = await db
		.select({ id: companies.id, name: companies.name })
		.from(companies)
		.where(eq(companies.gameId, gameId));
	if (compList.length === 0)
		throw Error(`no companies found for game ${gameId}`);
	await connection;
	await client.publish(`game:session:${body.gameCode}`, JSON.stringify({type: "joined", companies: compList}));
}
