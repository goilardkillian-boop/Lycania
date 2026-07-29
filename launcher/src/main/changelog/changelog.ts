import type { ChangelogEntry } from '@shared/types'
import { fetchLauncherConfigJson } from '../launcherConfig'

/**
 * Récupère les notes de version depuis launcher-config/changelog.json : les modifier sur GitHub
 * (nouveaux mods, correctifs...) les fait apparaître dans le launcher sans nouvelle version à
 * publier, y compris pour des changements qui ne touchent que le modpack.
 */
export async function fetchChangelog(): Promise<ChangelogEntry[]> {
  const json = await fetchLauncherConfigJson<unknown>('changelog.json')
  if (!Array.isArray(json)) return []
  return json.filter(
    (entry): entry is ChangelogEntry =>
      typeof entry === 'object' &&
      entry !== null &&
      typeof (entry as ChangelogEntry).version === 'string' &&
      typeof (entry as ChangelogEntry).date === 'string' &&
      Array.isArray((entry as ChangelogEntry).changes)
  )
}
