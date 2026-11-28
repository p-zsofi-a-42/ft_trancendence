// Bumped after a profile picture upload. Avatars of the signed-in user add it to their image URL so the browser reloads them.
export function useAvatarVersion() {
  return useState<number>('avatar:version', () => 0)
}
