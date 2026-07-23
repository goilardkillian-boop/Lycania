import type { ChildProcess } from 'node:child_process'
import { launch, createMinecraftProcessWatcher, createQuickPlayMultiplayer, type ResolvedVersion } from '@xmcl/core'
import { resolveJava } from '@xmcl/installer'
import type { GameProfile, LauncherSettings } from '@shared/types'
import { ensureJavaRuntime } from '../install/javaRuntime'

export interface LaunchDependencies {
  resolvedVersion: ResolvedVersion
  settings: LauncherSettings
  profile: GameProfile
  accessToken: string
}

function parseServerAddress(address: string): { ip: string; port?: number } | undefined {
  const trimmed = address.trim()
  if (!trimmed) return undefined
  const [ip, portStr] = trimmed.split(':')
  const port = portStr ? Number(portStr) : undefined
  return { ip, port: Number.isFinite(port) ? port : undefined }
}

async function resolveJavaPath(settings: LauncherSettings, resolvedVersion: ResolvedVersion): Promise<string> {
  if (settings.javaPath) {
    const info = await resolveJava(settings.javaPath)
    if (!info) {
      throw new Error(`Le chemin Java configuré est invalide: ${settings.javaPath}`)
    }
    return settings.javaPath
  }
  return ensureJavaRuntime(resolvedVersion.javaVersion.component, settings.gameDirectory)
}

/**
 * Lance Minecraft et retourne le process enfant ainsi qu'un watcher permettant
 * de suivre son cycle de vie (démarrage, crash, sortie normale).
 */
export async function launchGame(
  deps: LaunchDependencies
): Promise<{ process: ChildProcess; watcher: ReturnType<typeof createMinecraftProcessWatcher> }> {
  const { resolvedVersion, settings, profile, accessToken } = deps

  const javaPath = await resolveJavaPath(settings, resolvedVersion)
  const server = parseServerAddress(settings.serverAddress)
  const extraJVMArgs = settings.extraJvmArgs
    .split('\n')
    .map((s: string) => s.trim())
    .filter(Boolean)

  const childProcess = await launch({
    gamePath: settings.gameDirectory,
    javaPath,
    version: resolvedVersion,
    gameProfile: { id: profile.minecraftUuid, name: profile.minecraftUsername },
    accessToken,
    userType: 'mojang',
    minMemory: settings.minMemoryMb,
    maxMemory: settings.maxMemoryMb,
    extraJVMArgs: extraJVMArgs.length ? extraJVMArgs : undefined,
    launcherName: 'Lycania Launcher',
    launcherBrand: 'lycania',
    quickPlayMultiplayer: server ? createQuickPlayMultiplayer(server.ip, server.port) : undefined
  })

  const watcher = createMinecraftProcessWatcher(childProcess)
  return { process: childProcess, watcher }
}
