import { config } from './config'

/**
 * Lit un fichier JSON depuis launcher-config/ sur la branche main du dépôt du launcher, en direct
 * via raw.githubusercontent.com (pas de cache ni de build requis). Sert de base à tout ce que les
 * joueurs doivent voir se mettre à jour sans nouvelle version du launcher à publier (vidéos
 * TikTok, notes de version...).
 */
export async function fetchLauncherConfigJson<T>(filename: string): Promise<T | undefined> {
  // Casse-cache : raw.githubusercontent.com sert des réponses avec un cache assez agressif.
  const url = `https://raw.githubusercontent.com/${config.launcherRepo}/main/launcher-config/${filename}?t=${Date.now()}`
  try {
    const res = await fetch(url)
    if (!res.ok) return undefined
    return (await res.json()) as T
  } catch {
    return undefined
  }
}
