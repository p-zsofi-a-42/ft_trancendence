import { defineHandler, readBody, createError } from 'h3'

export default defineHandler(async (event) => {
	const body = await readBody(event);
	console.log(`game: ${body.name}`);
  return { success: true, data: body };
});
