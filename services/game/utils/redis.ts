import { createClient } from "redis";

const client = createClient({ url: process.env.REDIS_URL });

client.on("error", (e) => console.error("redis error:", e.message));
let connecting: Promise<unknown> | undefined;

export async function publish(channel: string, message: unknown): Promise<void> {
	connecting ??= client.connect();
	await connecting;
	await client.publish(channel, JSON.stringify(message));
}
// export const connection = await client.connect();

