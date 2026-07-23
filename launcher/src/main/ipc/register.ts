import { ipcMain, BrowserWindow, dialog, shell } from 'electron'
import { IPC } from '@shared/types'
import type { LauncherSettings } from '@shared/types'
import { authManager, gameState } from '../gameState'
import { ensureMinecraftInstalled } from '../install/minecraftInstall'
import { syncModpack } from '../modpack/sync'
import { launchGame } from '../launch/launch'
import { loadSettings, saveSettings } from '../settings/store'
import { config } from '../config'
import { installUpdateNow } from '../update/autoUpdate'
import { resolveJava } from '@xmcl/installer'

function broadcast(channel: string, ...args: unknown[]): void {
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send(channel, ...args)
  }
}

export function registerIpcHandlers(): void {
  authManager.on('state', (state) => broadcast(IPC.authOnState, state))
  authManager.on('progress', (progress) => broadcast(IPC.authOnProgress, progress))

  ipcMain.handle(IPC.authGetState, () => authManager.getState())
  ipcMain.handle(IPC.authSignIn, () => authManager.signIn())
  ipcMain.handle(IPC.authSignOut, () => authManager.signOut())

  ipcMain.handle(IPC.installStart, async () => {
    const settings = await loadSettings()

    const syncResult = await syncModpack(config.modpackRepo, settings.gameDirectory, (p) =>
      broadcast(IPC.installOnProgress, p)
    )
    gameState.packManifest = syncResult.manifest

    const resolvedVersion = await ensureMinecraftInstalled(
      {
        minecraftVersion: syncResult.manifest.minecraftVersion,
        neoforgeVersion: syncResult.manifest.neoforgeVersion,
        gameDirectory: settings.gameDirectory
      },
      (p) => broadcast(IPC.installOnProgress, p)
    )
    gameState.resolvedVersion = resolvedVersion

    return { manifest: syncResult.manifest }
  })

  ipcMain.handle(IPC.launchStart, async () => {
    if (!gameState.resolvedVersion || !gameState.packManifest) {
      throw new Error("Le jeu n'est pas installé. Lance l'installation avant de jouer.")
    }

    const settings = await loadSettings()
    const { accessToken, profile } = await authManager.getValidMinecraftAccessToken()

    broadcast(IPC.launchOnState, { phase: 'preparing' })
    const { process: child, watcher } = await launchGame({
      resolvedVersion: gameState.resolvedVersion,
      settings,
      profile,
      accessToken
    })
    gameState.runningProcess = child
    broadcast(IPC.launchOnState, { phase: 'starting' })

    child.stdout?.on('data', (buf: Buffer) => broadcast(IPC.launchOnLog, buf.toString('utf8')))
    child.stderr?.on('data', (buf: Buffer) => broadcast(IPC.launchOnLog, buf.toString('utf8')))

    watcher.on('minecraft-window-ready', () => broadcast(IPC.launchOnState, { phase: 'running' }))
    watcher.on('minecraft-exit', (event) => {
      gameState.runningProcess = undefined
      broadcast(IPC.launchOnState, { phase: 'exited', exitCode: event.code })
    })
    watcher.on('error', (err) => {
      gameState.runningProcess = undefined
      broadcast(IPC.launchOnState, { phase: 'error', error: err instanceof Error ? err.message : String(err) })
    })

    return { started: true }
  })

  ipcMain.handle(IPC.settingsGet, () => loadSettings())
  ipcMain.handle(IPC.settingsSet, (_e, patch: Partial<LauncherSettings>) => saveSettings(patch))

  ipcMain.handle(IPC.settingsPickGameDirectory, async () => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory', 'createDirectory'] })
    if (result.canceled || !result.filePaths[0]) return undefined
    return result.filePaths[0]
  })

  ipcMain.handle(IPC.settingsPickJava, async () => {
    const result = await dialog.showOpenDialog({ properties: ['openFile'] })
    if (result.canceled || !result.filePaths[0]) return undefined
    const info = await resolveJava(result.filePaths[0])
    if (!info) throw new Error("Ce fichier n'est pas un exécutable Java valide.")
    return result.filePaths[0]
  })

  ipcMain.handle(IPC.appGetVersionInfo, () => ({ launcherVersion: process.env.npm_package_version ?? '0.0.0' }))
  ipcMain.handle(IPC.appOpenExternal, (_e, url: string) => shell.openExternal(url))
  ipcMain.handle(IPC.updateInstallNow, () => installUpdateNow())
}
