import { getRequestHeader, type H3Event } from "h3";
import { HTTPError } from "nitro";
import z from "zod";

const UserId = z.coerce.number().int().min(1);

export function getUserId(event: H3Event): number {
	const parsed = UserId.safeParse(getRequestHeader(event, "user-id"));
	if (!parsed.success)
		throw new HTTPError({ status: 401, statusMessage: "unauthorized" });
	return parsed.data;
}
