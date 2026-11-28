import { defineHandler, readValidatedBody } from "h3";
import z from "zod";
import { and, eq } from "drizzle-orm";
import { publish } from "@utils/redis";
import { db, games, companies } from "@utils/db";
import { HTTPError } from "nitro";

const validInput = z.strictObject({
  gameCode: z.string().min(6).max(12),
  name: z.string().max(20),
});

/*
 * Create a new company for a game, identified by its code
 */
export default defineHandler(async (event) => {
  const userId = z.coerce
    .number()
    .int()
    .positive()
    .parse(event.req.headers.get("user-id"));
  const body = await readValidatedBody(event, validInput.parse);
  let row;

  try {
    row = await db.transaction(async (tx) => {
      const [game] = await tx
        .select({
          id: games.id,
          nPlayers: games.nPlayers,
          status: games.status,
        })
        .from(games)
        .where(eq(games.idCode, body.gameCode))
        .for("update");

      if (!game) {
        throw new HTTPError({
          statusMessage: "game does not exist",
          status: 400,
        });
      }

      if (game.status !== "created") {
        throw new HTTPError({
          statusMessage: "game is no longer accepting players",
          status: 400,
        });
      }

      const existingPlayer = await tx
        .select({ id: companies.id })
        .from(companies)
        .where(
          and(eq(companies.gameId, game.id), eq(companies.userId, userId)),
        );

      if (existingPlayer.length > 0) {
        throw new HTTPError({ statusMessage: "already joined", status: 400 });
      }

      const currentPlayers = await tx
        .select({ id: companies.id })
        .from(companies)
        .where(eq(companies.gameId, game.id));

      if (currentPlayers.length >= game.nPlayers) {
        throw new HTTPError({ statusMessage: "foyer is full", status: 400 });
      }

      const [createdCompany] = await tx
        .insert(companies)
        .values({ name: body.name, gameId: game.id, userId })
        .returning();

      if (!createdCompany) {
        throw new HTTPError({
          statusMessage: "failed to create company",
          status: 500,
        });
      }

      return createdCompany;
    });
  } catch (error: any) {
    console.log(`Error at /api/company/create.post: ${error.message}`);
    if (error instanceof HTTPError) throw error;

    throw new HTTPError({
      statusMessage: "failed to retrieve game",
      status: 500,
    });
  }

  // publish the new company to the game session channel
  await publish(`game:session:${body.gameCode}`, {
    type: "joined",
    company: row,
  });
  return row;
});
