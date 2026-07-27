import { platform as osPlatform } from 'node:os'
import { join } from 'node:path'
import { readdir } from 'node:fs/promises'
import { fetchJavaRuntimeManifest, installJavaRuntimeTask, type JavaRuntimeManifest } from '@xmcl/installer'
import { resolveJava } from '@xmcl/installer'
import type { TaskContext } from '@xmcl/task'

const JAVA_EXECUTABLE_NAME = osPlatform() === 'win32' ? 'javaw.exe' : 'java'

async function findJavaExecutable(root: string): Promise<string | undefined> {
  let entries
  try {
    entries = await readdir(root, { withFileTypes: true })
  } catch {
    return undefined
  }

  for (const entry of entries) {
    const full = join(root, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'bin') {
        const candidate = join(full, JAVA_EXECUTABLE_NAME)
        const info = await resolveJava(candidate)
        if (info) return candidate
      }
      const nested = await findJavaExecutable(full)
      if (nested) return nested
    }
  }
  return undefined
}

export interface JavaProgress {
  /** undefined quand la taille totale n'est pas encore connue (progression indéterminée) */
  progress?: number
  detail: string
}

/**
 * S'assure qu'un runtime Java compatible avec `component` (ex: "java-runtime-delta" pour Java 21)
 * est installé sous `<gameDirectory>/runtime/<component>`, et retourne le chemin de l'exécutable java.
 * Réutilise l'installation existante si elle est déjà complète.
 */
export async function ensureJavaRuntime(
  component: string,
  gameDirectory: string,
  onProgress?: (p: JavaProgress) => void
): Promise<string> {
  const destination = join(gameDirectory, 'runtime', component)

  const existing = await findJavaExecutable(destination)
  if (existing) return existing

  onProgress?.({ progress: 0, detail: `Téléchargement de Java (${component})…` })

  const manifest: JavaRuntimeManifest = await fetchJavaRuntimeManifest({ target: component })

  const task = installJavaRuntimeTask({ destination, manifest })
  const context: TaskContext = {
    onUpdate: (t) => {
      // t.total vaut -1 tant que la taille totale n'est pas encore connue (et peut rester négatif
      // un moment le temps que les tâches enfants découvrent la leur) : dans ce cas on ne peut pas
      // calculer de vrai pourcentage, autant l'indiquer comme indéterminé plutôt qu'afficher "0%".
      const progress = t.total > 0 ? Math.min(Math.max(t.progress / t.total, 0), 1) : undefined
      onProgress?.({ progress, detail: `Installation de Java (${component})…` })
    }
  }
  await task.startAndWait(context)

  const javaPath = await findJavaExecutable(destination)
  if (!javaPath) {
    throw new Error(`Le runtime Java (${component}) a été installé mais l'exécutable est introuvable.`)
  }
  return javaPath
}
