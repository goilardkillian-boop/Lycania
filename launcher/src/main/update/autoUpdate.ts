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

/**
 * Vérifie une mise à jour de façon bloquante, à appeler juste avant de jouer : impossible de
 * lancer le jeu sur une version obsolète. S'il y en a une, la télécharge (ou attend la fin du
 * téléchargement déjà en cours) puis redémarre l'app pour l'installer immédiatement, sans
 * possibilité de l'ignorer. Ne résout donc que dans le cas "déjà à jour" ; dans l'autre cas,
 * l'application quitte avant que la promesse n'ait besoin de se résoudre.
 */
export function checkForUpdateBeforePlay(): Promise<'up-to-date' | 'installing'> {
  return new Promise((resolve, reject) => {
    const onNotAvailable = (): void => {
      cleanup()
      resolve('up-to-date')
    }
    const onDownloaded = (): void => {
      cleanup()
      resolve('installing')
      autoUpdater.quitAndInstall()
    }
    const onError = (err: Error): void => {
      cleanup()
      reject(err)
    }
    function cleanup(): void {
      autoUpdater.removeListener('update-not-available', onNotAvailable)
      autoUpdater.removeListener('update-downloaded', onDownloaded)
      autoUpdater.removeListener('error', onError)
    }

    autoUpdater.once('update-not-available', onNotAvailable)
    autoUpdater.once('update-downloaded', onDownloaded)
    autoUpdater.once('error', onError)
    autoUpdater.checkForUpdates().catch(onError)
  })
}
