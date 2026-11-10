import crypto from "node:crypto";

// Alphanumeric without I, L, O & U to avoid confusion
const CHARACTERS = "ABCDEFGHJKMNPQRSTVWXYZ0123456789";

export function genCode(length: number = 6): string {
	let result = "";

	for (let i = 0; i < length; i++)
		result += CHARACTERS[crypto.randomInt(CHARACTERS.length)];
	return result;
}
