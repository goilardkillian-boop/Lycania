import { app } from 'electron'
import { totalmem } from 'node:os'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import type { LauncherSettings } from '@shared/types'

function settingsFilePath(): string {
  return join(app.getPath('userData'), 'settings.json')
}

function defaultGameDirectory(): string {
  return join(app.getPath('appData'), 'LycaniaLauncher', 'instance')
}

function defaultMaxMemoryMb(): number {
  const totalMb = Math.floor(totalmem() / (1024 * 1024))
  return Math.min(6144, Math.max(2048, Math.floor(totalMb / 2)))
}

function defaultSettings(): LauncherSettings {
  return {
    gameDirectory: defaultGameDirectory(),
    minMemoryMb: 1024,
    maxMemoryMb: defaultMaxMemoryMb(),
    javaPath: '',
    serverAddress: '',
    extraJvmArgs: '',
    closeOnLaunch: false
  }
}

let cache: LauncherSettings | undefined

export async function loadSettings(): Promise<LauncherSettings> {
  if (cache) return cache
  try {
    const raw = await readFile(settingsFilePath(), 'utf8')
    cache = { ...defaultSettings(), ...(JSON.parse(raw) as Partial<LauncherSettings>) }
  } catch {
    cache = defaultSettings()
  }
  return cache
}

export async function saveSettings(patch: Partial<LauncherSettings>): Promise<LauncherSettings> {
  const current = await loadSettings()
  cache = { ...current, ...patch }
  const path = settingsFilePath()
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, JSON.stringify(cache, null, 2))
  return cache
}
