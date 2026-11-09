import { createError } from "h3";
import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { db, games } from "./db";

// without I, L, O & U to avoid confusion
const CHARACTERS = "ABCDEFGHJKMNPQRSTVWXYZ0123456789";

function genCode(length: number): string {
	let	result = "";

	for (let i = 0; i < length; i++)
		result += CHARACTERS[crypto.randomInt(CHARACTERS.length)];
	return result;
}

// generate a unique id_code for newGame and insert it into the games table
export async function insertGame(newGame: Omit<Game, "id_code">): Promise<string> {
	for (let	length = 0; length < 12; length++) {
		for (let	attempt = 0; attempt < 5; attempt++) {
			const row = db.insert(games)
				.values({... newGame, id_code: genCode(length)})
				.onConflictDoNothing({target: games.id_code})
				.returning();
			if (row) return row;
		}
	}
	throw createError({
		statusCode: 500,
		statusMessage: "Could not generate a game code"
	});
}
