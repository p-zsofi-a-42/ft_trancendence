import { generateGameCode } from '#server/utils/gameCode';
/**
 * Handles POST requests for creating a new game.
 ** @brief Creates a session for a new game.
 * 
 ** @returns The { code } of the newly created game.
 */
export default eventHandler(async (event) => {
  // Your logic for creating a new game session goes here
  const code = await generateGameCode();
  return { code };
});