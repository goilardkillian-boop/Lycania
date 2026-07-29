import { config } from '../config'

interface TikTokVideosFile {
  videoIds: unknown
}

/**
 * Accepte aussi bien un lien complet (https://www.tiktok.com/@compte/video/1234567890) qu'un
 * simple ID numérique, pour que coller l'URL copiée depuis le navigateur suffise.
 */
function extractVideoId(entry: unknown): string | undefined {
  if (typeof entry !== 'string') return undefined
  const trimmed = entry.trim()
  const fromUrl = trimmed.match(/\/video\/(\d+)/)?.[1]
  if (fromUrl) return fromUrl
  return /^\d+$/.test(trimmed) ? trimmed : undefined
}

/**
 * Récupère la liste des vidéos TikTok à afficher, depuis launcher-config/tiktok-videos.json sur
 * la branche main du dépôt du launcher. Volontairement lu en direct via raw.githubusercontent.com
 * à chaque appel (pas de cache ni de build requis) : coller un lien de vidéo dans ce fichier sur
 * GitHub suffit à le faire apparaître dans le launcher, sans nouvelle version à publier.
 */
export async function fetchTikTokVideoIds(): Promise<string[]> {
  // Casse-cache : raw.githubusercontent.com sert des réponses avec un cache assez agressif.
  const url = `https://raw.githubusercontent.com/${config.launcherRepo}/main/launcher-config/tiktok-videos.json?t=${Date.now()}`
  try {
    const res = await fetch(url)
    if (!res.ok) return []
    const json = (await res.json()) as TikTokVideosFile
    if (!Array.isArray(json.videoIds)) return []
    return json.videoIds.map(extractVideoId).filter((id): id is string => id !== undefined)
  } catch {
    return []
  }
}
