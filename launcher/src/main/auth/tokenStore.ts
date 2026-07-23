import { app, safeStorage } from 'electron'
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises'
import { dirname, join } from 'node:path'

export interface StoredSession {
  microsoftRefreshToken: string
  minecraftUuid: string
  minecraftUsername: string
  skinUrl?: string
}

function filePath(): string {
  return join(app.getPath('userData'), 'auth', 'session.enc')
}

export async function saveSession(session: StoredSession): Promise<void> {
  const path = filePath()
  await mkdir(dirname(path), { recursive: true })
  const plain = Buffer.from(JSON.stringify(session), 'utf8')
  const payload = safeStorage.isEncryptionAvailable() ? safeStorage.encryptString(plain.toString('utf8')) : plain
  await writeFile(path, payload)
}

export async function loadSession(): Promise<StoredSession | undefined> {
  try {
    const raw = await readFile(filePath())
    const json = safeStorage.isEncryptionAvailable() ? safeStorage.decryptString(raw) : raw.toString('utf8')
    return JSON.parse(json) as StoredSession
  } catch {
    return undefined
  }
}

export async function clearSession(): Promise<void> {
  await rm(filePath(), { force: true })
}
