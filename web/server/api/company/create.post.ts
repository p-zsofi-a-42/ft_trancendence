import { defineEventHandler, readBody, createError } from 'h3'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const body = await readBody(event);
	console.log(`body: ${JSON.stringify(body)}`);
	
	// validate
  return callGameService('/api/company/create', { method: 'POST', body: body, userId: user.id});
});
