import { createClient } from "redis";

export const client = createClient({ url: process.env.REDIS_URL });

export const connection = await client.connect();

