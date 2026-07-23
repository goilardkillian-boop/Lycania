import { createHash } from 'node:crypto'
import { createWriteStream } from 'node:fs'
import { mkdir, readFile, writeFile, rm, stat } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { pipeline } from 'node:stream/promises'
import type { InstallProgress, PackManifest } from '@shared/types'

const MARKER_FILE = 'lycania-pack-version.json'

async function fetchLatestReleaseManifest(repo: string): Promise<PackManifest> {
  const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
    headers: { Accept: 'application/vnd.github+json' }
  })
  if (!res.ok) {
    throw new Error(`Impossible de récupérer la dernière release du modpack (${repo}): ${res.status}`)
  }
  const release = (await res.json()) as { assets: Array<{ name: string; browser_download_url: string }> }
  const asset = release.assets.find((a) => a.name === 'pack-manifest.json')
  if (!asset) {
    throw new Error(`La release du modpack ne contient pas de pack-manifest.json (${repo}).`)
  }
  const manifestRes = await fetch(asset.browser_download_url)
  if (!manifestRes.ok) {
    throw new Error(`Échec du téléchargement de pack-manifest.json: ${manifestRes.status}`)
  }
  return (await manifestRes.json()) as PackManifest
}

async function sha1Of(path: string): Promise<string | undefined> {
  try {
    const buf = await readFile(path)
    return createHash('sha1').update(buf).digest('hex')
  } catch {
    return undefined
  }
}

async function downloadFile(url: string, destination: string): Promise<void> {
  await mkdir(dirname(destination), { recursive: true })
  const res = await fetch(url)
  if (!res.ok || !res.body) {
    throw new Error(`Échec du téléchargement de ${url}: ${res.status}`)
  }
  const nodeStream = createWriteStream(destination)
  await pipeline(res.body as unknown as NodeJS.ReadableStream, nodeStream)
}

async function readInstalledVersion(gameDirectory: string): Promise<string | undefined> {
  try {
    const raw = await readFile(join(gameDirectory, MARKER_FILE), 'utf8')
    return (JSON.parse(raw) as { packVersion: string }).packVersion
  } catch {
    return undefined
  }
}

async function writeInstalledVersion(gameDirectory: string, manifest: PackManifest): Promise<void> {
  await writeFile(
    join(gameDirectory, MARKER_FILE),
    JSON.stringify({ packVersion: manifest.packVersion, publishedAt: manifest.publishedAt }, null, 2)
  )
}

export interface SyncResult {
  manifest: PackManifest
  updated: boolean
}

/**
 * Synchronise le dossier de jeu avec la dernière release publiée sur `repo` (owner/name GitHub
 * de lycania-files): télécharge les mods/overrides manquants ou modifiés, supprime ceux retirés
 * du pack, et ne retouche pas aux fichiers déjà à jour (vérifiés par sha1).
 */
export async function syncModpack(
  repo: string,
  gameDirectory: string,
  onProgress?: (p: InstallProgress) => void
): Promise<SyncResult> {
  onProgress?.({ phase: 'modpack-manifest', detail: 'Vérification de la dernière version du modpack…' })
  const manifest = await fetchLatestReleaseManifest(repo)

  const installedVersion = await readInstalledVersion(gameDirectory)
  if (installedVersion === manifest.packVersion) {
    onProgress?.({ phase: 'ready', progress: 1, detail: 'Modpack déjà à jour.' })
    return { manifest, updated: false }
  }

  const toDownload: PackManifest['files'] = []
  for (const file of manifest.files) {
    const destination = join(gameDirectory, file.path)
    const currentHash = await sha1Of(destination)
    if (currentHash !== file.sha1) toDownload.push(file)
  }

  let done = 0
  for (const file of toDownload) {
    onProgress?.({
      phase: 'modpack-files',
      progress: toDownload.length ? done / toDownload.length : 1,
      detail: 'Téléchargement des mods…',
      currentFile: file.path,
      filesDone: done,
      filesTotal: toDownload.length
    })
    await downloadFile(file.url, join(gameDirectory, file.path))
    done += 1
  }

  for (const removedPath of manifest.removedPaths ?? []) {
    const target = join(gameDirectory, removedPath)
    const info = await stat(target).catch(() => undefined)
    if (info) await rm(target, { force: true })
  }

  await writeInstalledVersion(gameDirectory, manifest)
  onProgress?.({ phase: 'ready', progress: 1, detail: 'Modpack à jour.' })
  return { manifest, updated: true }
}
