import { defineHandler, getRequestHeader, readValidatedBody, createError } from "h3";
import { client, connection } from "@utils/redis";
import z from "zod";
import { eq } from "drizzle-orm"
import { db, games, companies } from "@utils/db";


const validInput = z.strictObject({
	gameCode: z.string().min(6).max(12),
});

export default defineHandler(async (event) => {
	const body = await readValidatedBody(event, validInput.parse);
	
	try {
		const [ game ] = await db
			.select({ id: games.id })
			.from(games)
			.where(eq(games.idCode, body.gameCode));
		if (!game.id)
			throw Error(`game code does not exist (${games.idCode})`);
		const compList = await db
			.select({ id: companies.id, name: companies.name })
			.from(companies)
			.where(eq(companies.gameId, game.id));
		if (compList.length === 0)
			throw Error(`no companies found for game ${game.id}`);
		await connection;
		await client.publish(`game:session:${body.gameCode}`, JSON.stringify({type: "joined", companies: compList}));
	} catch (error) {
		console.log(`Error at /api/company/test.post: ${error.message}`);
		throw createError({
			statusCode: 500,
			statusMessage: "test failed"
		});
	}
	return {statusCode: 200};
});
