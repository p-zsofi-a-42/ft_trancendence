/**
 * Generates a unique game code.
 *
 * @returns A string representing the generated game code.
 */
export async function generateGameCode(): Promise<string> {
  return crypto.getRandomValues(new Uint8Array(6))
    .reduce((acc, val) => acc + val.toString(16).padStart(2, '0'), '')
    .toUpperCase();
//   return "abcabc"
}