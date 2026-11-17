const PROVIDER_NAMES = ["42", "github"];

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event);
  const { provider } = await readBody(event);
  if (typeof provider !== "string" || !PROVIDER_NAMES.includes(provider)) {
    throw createError({ statusCode: 400, statusMessage: "Unknown provider" });
  }
  return callUserService<{ message: string }>("/internal/oauth/unlink", {
    userId: Number(user.id),
    body: { provider },
  });
});