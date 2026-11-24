import { createError } from "h3";

export async function callGameService<T>(
	path: string,
	options: { method?: "GET" | "POST" | "PATCH"; body?: unknown; userId?: number } = {},
): Promise<T> {
	const headers: Record<string, string> = {}

	// TODO: find a better way to pass information about the user to the service
	if (options.userId !== undefined)
		headers["user-id"] = String(options.userId);
	try {
		return await $fetch<T>(`${useRuntimeConfig().gameServiceUrl}${path}`, {
			method: options.method ?? "POST",
			body: options.body,
			headers,
		});
	} catch (error: any) {
		console.log(`Error calling game service at ${path}: ${error.message}`);
		const statusCode = error?.statusCode ?? error?.response?.status;

		if (statusCode && statusCode >= 400 && statusCode < 500)
			throw createError(error);
		throw createError({ message: "Game service unavailable", status: 502 });
	}
}
