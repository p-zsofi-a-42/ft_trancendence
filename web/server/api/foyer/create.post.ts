import { defineEventHandler, readBody, createError } from 'h3'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const body = await readBody(event);
	console.log(`body: ${body}`);
	
	// validate
  return callGameService('/api/foyer/create', { method: 'POST', body: body, userId: user.id});
});
