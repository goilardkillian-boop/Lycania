import { getVersionList, installTask, installNeoForgedTask } from '@xmcl/installer'
import { Version, type ResolvedVersion } from '@xmcl/core'
import type { TaskContext } from '@xmcl/task'
import type { InstallProgress } from '@shared/types'
import { ensureJavaRuntime } from './javaRuntime'

export interface InstallTarget {
  minecraftVersion: string
  neoforgeVersion: string
  gameDirectory: string
}

function progressContext(
  onProgress: ((p: InstallProgress) => void) | undefined,
  phase: InstallProgress['phase'],
  detail: string
): TaskContext {
  return {
    onUpdate: (task) => {
      const total = task.total || 1
      onProgress?.({ phase, progress: Math.min(task.progress / total, 1), detail })
    }
  }
}

/**
 * Installe (ou complète) Minecraft + NeoForge dans `gameDirectory`, en réutilisant tout
 * ce qui est déjà présent et valide. Retourne la version résolue prête à être lancée.
 */
export async function ensureMinecraftInstalled(
  target: InstallTarget,
  onProgress?: (p: InstallProgress) => void
): Promise<ResolvedVersion> {
  const { minecraftVersion, neoforgeVersion, gameDirectory } = target

  onProgress?.({ phase: 'checking', detail: 'Vérification de l’installation existante…' })

  const neoforgeVersionId = `neoforge-${neoforgeVersion}`
  try {
    const existing = await Version.parse(gameDirectory, neoforgeVersionId)
    onProgress?.({ phase: 'ready', progress: 1, detail: 'Déjà installé.' })
    return existing
  } catch {
    // Not installed yet, fall through to full install.
  }

  onProgress?.({ phase: 'minecraft', progress: 0, detail: `Téléchargement de Minecraft ${minecraftVersion}…` })
  const versionList = await getVersionList()
  const versionMeta = versionList.versions.find((v) => v.id === minecraftVersion)
  if (!versionMeta) {
    throw new Error(`Version de Minecraft introuvable dans le manifeste Mojang: ${minecraftVersion}`)
  }

  const vanilla = await installTask(versionMeta, gameDirectory).startAndWait(
    progressContext(onProgress, 'minecraft', `Téléchargement de Minecraft ${minecraftVersion}…`)
  )

  const javaPath = await ensureJavaRuntime(vanilla.javaVersion.component, gameDirectory, (p) =>
    onProgress?.({ phase: 'java', progress: p.progress, detail: p.detail })
  )

  onProgress?.({ phase: 'neoforge', progress: 0, detail: `Installation de NeoForge ${neoforgeVersion}…` })
  const installedVersionId = await installNeoForgedTask('neoforge', neoforgeVersion, gameDirectory, {
    java: javaPath
  }).startAndWait(progressContext(onProgress, 'neoforge', `Installation de NeoForge ${neoforgeVersion}…`))

  const resolved = await Version.parse(gameDirectory, installedVersionId)
  onProgress?.({ phase: 'ready', progress: 1, detail: 'Installation terminée.' })
  return resolved
}
