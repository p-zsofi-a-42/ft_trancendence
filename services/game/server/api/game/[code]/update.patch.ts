import { defineHandler, readValidatedBody, getValidatedRouterParams } from "h3";
import { HTTPError } from "nitro";
import z from "zod";
import { and, eq, not } from "drizzle-orm";
import { games, companies, db } from "@utils/db";
import { publish } from "@utils/redis";

const validParams = z.object({
  code: z.string().min(6).max(12),
});

const validInput = z
  .strictObject({
    nPlayers: z.number().int().min(1).max(5),
    nRounds: z.number().int().min(1).max(40),
    seedCapital: z.coerce.number().min(100_000).max(10_000_000),
    minutesPerRound: z.number().int().min(1).max(60),
  })
  .partial();

/*
 * Update a game, identified by its game code, with the fields provided in the request body validated against the validInput schema.
 * The user making the request must be the creator of the game.
 */
export default defineHandler(async (event) => {
  const routerParams = await getValidatedRouterParams(event, validParams);
  const userId = z.coerce
    .number()
    .int()
    .positive()
    .parse(event.req.headers.get("user-id"));
  const body = await readValidatedBody(event, validInput.parse);
  let row = undefined;

  if (Object.keys(body).length === 0)
    throw new HTTPError({ statusMessage: "empty body", status: 400 });
  try {
    [row] = await db.transaction(async (tx) => {
      const [game] = await tx
        .select({
          id: games.id,
          nPlayers: games.nPlayers,
        })
        .from(games)
        .where(
          and(
            eq(games.idCode, routerParams.code),
            eq(games.creatorId, userId),
            not(eq(games.status, "done")),
          ),
        )
        .for("update");

      if (!game) return [];

      const currentPlayers = await tx
        .select({ id: companies.id })
        .from(companies)
        .where(eq(companies.gameId, game.id));

      const requestedCapacity = body.nPlayers ?? game.nPlayers;

      if (currentPlayers.length > requestedCapacity) {
        throw new HTTPError({
          statusMessage: `cannot set Number of Players below the current player count (${currentPlayers.length})`,
          status: 400,
        });
      }
      return tx
        .update(games)
        .set(body)
        .where(eq(games.id, game.id))
        .returning();
    });
  } catch (error: any) {
    console.log(`Error at /api/game/[code]/update.patch: ${error.message}`);
    if (error instanceof HTTPError) throw error;
    throw new HTTPError({ statusMessage: "game update failed", status: 500 });
  }
  if (!row) {
    throw new HTTPError({ statusMessage: "update not permitted", status: 400 });
  }

  await publish(`game:session:${routerParams.code}`, {
    type: "settings_updated",
    game: row,
  });

  console.log(
    `game(${routerParams.code}) successfully updated: ${JSON.stringify(row)}`,
  );

  return row;
});
