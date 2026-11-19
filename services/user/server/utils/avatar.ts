import { randomUUID } from 'node:crypto'
import { join, basename } from 'node:path'
import { mkdir, unlink, writeFile } from 'node:fs/promises'

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024

const IMAGE_TYPES = [
  {
    ext: 'png',
    mime: 'image/png',
    matches: (b: Buffer) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    ext: 'jpg',
    mime: 'image/jpeg',
    matches: (b: Buffer) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    ext: 'webp',
    mime: 'image/webp',
    matches: (b: Buffer) => b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP',
  },
]

// Checks the file's magic bytes, not the client-supplied MIME type
export function detectImageType(data: Buffer) {
  return IMAGE_TYPES.find(t => t.matches(data)) ?? null
}

export function mimeForAvatarFile(fileName: string): string | null {
  const ext = fileName.split('.').pop()
  return IMAGE_TYPES.find(t => t.ext === ext)?.mime ?? null
}

function avatarDir(): string {
  if (!process.env.AVATAR_DIR) throw new Error('AVATAR_DIR must be set')
  return process.env.AVATAR_DIR
}

// Stores the image under a server-generated name and returns that name
export async function saveAvatarFile(data: Buffer, ext: string): Promise<string> {
  const dir = avatarDir()
  await mkdir(dir, { recursive: true })
  const fileName = `${randomUUID()}.${ext}`
  await writeFile(join(dir, fileName), data)
  return fileName
}

export async function removeAvatarFile(fileName: string): Promise<void> {
  await unlink(join(avatarDir(), basename(fileName))).catch(() => {})
}

export function avatarFilePath(fileName: string): string {
  return join(avatarDir(), basename(fileName))
}
