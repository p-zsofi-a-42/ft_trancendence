export default defineEventHandler(async (event) => {
  return callGameService('/games/create', { method: 'GET'})
})
