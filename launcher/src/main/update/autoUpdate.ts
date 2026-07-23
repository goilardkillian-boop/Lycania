import { autoUpdater } from 'electron-updater'
import { config } from '../config'

export interface UpdateHooks {
  onAvailable?: (version: string) => void
  onProgress?: (percent: number) => void
  onDownloaded?: (version: string) => void
  onError?: (message: string) => void
}

/**
 * Configure electron-updater pour publier/consulter les releases GitHub du dépôt du launcher.
 * Ne fait rien en développement (`npm run dev`), seulement sur un build packagé.
 */
export function initAutoUpdate(hooks: UpdateHooks): void {
  const [owner, repo] = config.launcherRepo.split('/')
  autoUpdater.setFeedURL({ provider: 'github', owner, repo })
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('update-available', (info) => hooks.onAvailable?.(info.version))
  autoUpdater.on('download-progress', (p) => hooks.onProgress?.(p.percent))
  autoUpdater.on('update-downloaded', (info) => hooks.onDownloaded?.(info.version))
  autoUpdater.on('error', (err) => hooks.onError?.(err.message))

  autoUpdater.checkForUpdates().catch((err) => hooks.onError?.(err.message))
}

export function installUpdateNow(): void {
  autoUpdater.quitAndInstall()
}
