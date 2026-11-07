import { createError } from "h3";
import crypto from "node:crypto";
import { db } from "./db";
import { games } from "../db/schema/games";
import { eq } from "drizzle-orm";

const CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function genCode(length: number): string {
	let		result = "";
	const	randoms = crypto.randomBytes(length);

	for (let i = 0; i < length; i++)
		result += CHARACTERS[randoms[i] % CHARACTERS.length];
	return result;
}
// 1. try to gen with length (default=6)
// 2. if it's unique -> return
// 3. else increase length and start recursion
export async function genGameCode(length: number): Promise<string> {
	let	code = "";
	let	attempt = 0;
	const	maxAttempts = 5;

	while (attempt++ < maxAttempts) {
		code = genCode(length);
		try {
			const row = await db
				.select({ id_code: games.id_code })
				.from(games)
				.where(eq(games.id_code, code))
				.limit(1);
			if (row.length === 0)
				return code;
		} catch (error) {
			throw createError({
				statusCode: 500,
				statusMessage: 'Database error: ' + error.message
			});
		}
	}
	return genGameCode(++length);
}
