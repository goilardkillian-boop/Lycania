#!/usr/bin/env node
// Résout modpack/manifest.json (export CurseForge) via l'API officielle CurseForge, télécharge
// chaque mod, et prépare un dossier prêt à publier comme release GitHub sur lycania-files:
//   dist/release/<fichiers mods + overrides>
//   dist/release/pack-manifest.json
//
// Nécessite la variable d'environnement CURSEFORGE_API_KEY (voir README > "CurseForge API key").
// Conçu pour tourner dans GitHub Actions (accès réseau complet), pas dans le sandbox de dev.

import { createHash } from 'node:crypto'
import { createWriteStream, existsSync, statSync } from 'node:fs'
import { mkdir, readFile, readdir, writeFile, copyFile } from 'node:fs/promises'
import { dirname, join, relative, sep } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(__dirname, '..')

const CURSEFORGE_API_KEY = process.env.CURSEFORGE_API_KEY
const RELEASE_TAG = process.env.RELEASE_TAG // ex: pack-2026.07.23-1
const MODPACK_FILES_REPO = process.env.MODPACK_FILES_REPO

if (!CURSEFORGE_API_KEY) {
  console.error('CURSEFORGE_API_KEY manquant. Ajoute-le en secret GitHub Actions (voir README).')
  process.exit(1)
}
if (!RELEASE_TAG) {
  console.error('RELEASE_TAG manquant (ex: pack-2026.07.23-1).')
  process.exit(1)
}

const manifestPath = join(repoRoot, 'modpack', 'manifest.json')
const overridesModsDir = join(repoRoot, 'modpack', 'overrides', 'mods')
const customModsDir = join(repoRoot, 'modpack', 'custom-mods')
const customFilesDir = join(repoRoot, 'modpack', 'custom-files')
const externalModsPath = join(repoRoot, 'modpack', 'external-mods.json')
const forceRemovePath = join(repoRoot, 'modpack', 'force-remove.json')
const outDir = join(repoRoot, 'dist', 'release')

async function sha1Of(path) {
  const buf = await readFile(path)
  return createHash('sha1').update(buf).digest('hex')
}

async function curseforgeFile(projectId, fileId) {
  const res = await fetch(`https://api.curseforge.com/v1/mods/${projectId}/files/${fileId}`, {
    headers: { 'x-api-key': CURSEFORGE_API_KEY, Accept: 'application/json' }
  })
  if (!res.ok) {
    throw new Error(`CurseForge API ${res.status} pour mod ${projectId} / fichier ${fileId}`)
  }
  const json = await res.json()
  return json.data
}

async function downloadTo(url, destination) {
  await mkdir(dirname(destination), { recursive: true })
  const res = await fetch(url)
  if (!res.ok || !res.body) throw new Error(`Téléchargement échoué (${res.status}): ${url}`)
  await pipeline(res.body, createWriteStream(destination))
}

/**
 * Les mods qui interdisent la redistribution tierce n'ont pas d'URL de téléchargement via l'API
 * CurseForge: il faut fournir le jar à la main. On les range dans overrides/mods/<projectID>.jar
 * (par ID de projet, stable) plutôt que par nom de fichier, qui change à chaque mise à jour du mod.
 */
async function listOverrideProjectIds() {
  if (!existsSync(overridesModsDir)) return new Set()
  const entries = await readdir(overridesModsDir)
  return new Set(
    entries.filter((e) => /^\d+\.jar$/.test(e)).map((e) => e.replace(/\.jar$/, ''))
  )
}

/**
 * Récupère la liste des chemins de fichiers de la précédente release publiée sur lycania-files,
 * pour pouvoir calculer quels fichiers ont été retirés du pack (le launcher les supprime chez les
 * joueurs via `removedPaths`). Retourne un tableau vide s'il n'y a pas encore de release.
 */
async function fetchPreviousFilePaths() {
  if (!MODPACK_FILES_REPO) return []
  const releaseRes = await fetch(`https://api.github.com/repos/${MODPACK_FILES_REPO}/releases/latest`, {
    headers: { Accept: 'application/vnd.github+json' }
  })
  if (!releaseRes.ok) return []
  const release = await releaseRes.json()
  const asset = release.assets?.find((a) => a.name === 'pack-manifest.json')
  if (!asset) return []
  const manifestRes = await fetch(asset.browser_download_url)
  if (!manifestRes.ok) return []
  const previous = await manifestRes.json()
  return (previous.files ?? []).map((f) => f.path)
}

/**
 * `removedPaths` ne couvre normalement que le diff avec la release immédiatement précédente : un
 * joueur qui saute plusieurs releases d'un coup (cas courant, le launcher ne récupère toujours que
 * la dernière) peut rater un retrait signalé uniquement dans une release intermédiaire, et se
 * retrouver avec un fichier orphelin qui ne sera plus jamais listé en suppression. modpack/force-
 * remove.json liste des chemins à toujours inclure dans removedPaths, pour republier une
 * suppression déjà "passée" et débloquer ces installations sans devoir republier le launcher.
 */
async function loadForceRemovePaths() {
  if (!existsSync(forceRemovePath)) return []
  return JSON.parse(await readFile(forceRemovePath, 'utf8'))
}

/**
 * Mods maison, jamais publiés sur CurseForge: pas de projectID/fileID à résoudre, on les copie
 * tels quels depuis modpack/custom-mods/*.jar directement dans le pack.
 */
async function addCustomMods(files) {
  if (!existsSync(customModsDir)) return
  const entries = (await readdir(customModsDir)).filter((e) => e.endsWith('.jar'))
  for (const fileName of entries) {
    const src = join(customModsDir, fileName)
    const dest = join(outDir, 'mods', fileName)
    await copyFile(src, dest)
    files.push({ path: `mods/${fileName}`, sha1: await sha1Of(dest), size: statSync(dest).size })
    console.log(`[custom] ${fileName}`)
  }
}

/**
 * Mods absents de CurseForge (ex: exclusivité Modrinth) mais téléchargeables directement, sans
 * clé d'API ni restriction: modpack/external-mods.json liste {fileName, url, sha1, size, folder}.
 * Téléchargés à chaque sync, jamais commités ici (certains dépassent largement la limite de 100 Mo
 * par fichier de GitHub). Le `sha1` attendu est optionnel mais recommandé: s'il est fourni et ne
 * correspond pas au fichier téléchargé, la sync échoue plutôt que de publier un fichier corrompu
 * ou une version différente de celle voulue.
 */
async function addExternalMods(files) {
  if (!existsSync(externalModsPath)) return
  const entries = JSON.parse(await readFile(externalModsPath, 'utf8'))
  for (const entry of entries) {
    const { fileName, url, sha1: expectedSha1, folder = 'mods' } = entry
    const dest = join(outDir, folder, fileName)
    await downloadTo(url, dest)
    const sha1 = await sha1Of(dest)
    if (expectedSha1 && sha1 !== expectedSha1.toLowerCase()) {
      throw new Error(
        `[external] ${fileName}: sha1 attendu ${expectedSha1}, obtenu ${sha1}. Le fichier a peut-être changé sur ${url}.`
      )
    }
    files.push({ path: `${folder}/${fileName}`, sha1, size: statSync(dest).size })
    console.log(`[external] ${fileName}`)
  }
}

async function walkFiles(dir, base = dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const results = []
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...(await walkFiles(full, base)))
    } else if (entry.isFile() && entry.name !== '.gitkeep') {
      results.push(relative(base, full))
    }
  }
  return results
}

/**
 * Tout ce qui n'est ni un mod CurseForge ni un jar maison: shaderpack, resourcepack, fichier de
 * config, etc. modpack/custom-files/ reproduit l'arborescence réelle du dossier .minecraft
 * (ex: custom-files/shaderpacks/MonShader.zip, custom-files/config/monshader.txt), et chaque
 * fichier est repris tel quel, au même chemin relatif, dans le pack.
 */
async function addCustomFiles(files) {
  if (!existsSync(customFilesDir)) return
  const relPaths = await walkFiles(customFilesDir)
  for (const relPath of relPaths) {
    const posixPath = relPath.split(sep).join('/')
    const src = join(customFilesDir, relPath)
    const dest = join(outDir, relPath)
    await mkdir(dirname(dest), { recursive: true })
    await copyFile(src, dest)
    files.push({ path: posixPath, sha1: await sha1Of(dest), size: statSync(dest).size })
    console.log(`[custom-file] ${posixPath}`)
  }
}

async function main() {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
  const overrideProjectIds = await listOverrideProjectIds()

  await mkdir(join(outDir, 'mods'), { recursive: true })

  const files = []
  const skipped = []

  for (const entry of manifest.files) {
    // `folder` est optionnel (défaut "mods"): permet de ranger un fichier CurseForge ailleurs,
    // typiquement "shaderpacks" pour un shaderpack (ex: Complementary Shaders, projet 385587).
    const { projectID, fileID, folder = 'mods' } = entry
    try {
      const info = await curseforgeFile(projectID, fileID)
      const fileName = info.fileName
      const relPath = `${folder}/${fileName}`

      if (overrideProjectIds.has(String(projectID))) {
        const src = join(overridesModsDir, `${projectID}.jar`)
        const dest = join(outDir, folder, fileName)
        await mkdir(dirname(dest), { recursive: true })
        await copyFile(src, dest)
        files.push({ path: relPath, sha1: await sha1Of(dest), size: statSync(dest).size })
        console.log(`[override] ${fileName} (projet ${projectID})`)
        continue
      }

      if (!info.downloadUrl) {
        skipped.push({ projectID, fileID, fileName })
        console.warn(`[SKIP] ${fileName} (projet ${projectID}) interdit de distribution tierce par l'auteur.`)
        continue
      }

      const dest = join(outDir, folder, fileName)
      await downloadTo(info.downloadUrl, dest)
      const sha1 = info.hashes?.find((h) => h.algo === 1)?.value?.toLowerCase() || (await sha1Of(dest))
      files.push({ path: relPath, sha1, size: info.fileLength })
      console.log(`[ok] ${fileName}`)
    } catch (err) {
      console.error(`Erreur pour le mod ${projectID}/${fileID}:`, err.message)
      process.exitCode = 1
    }
  }

  await addCustomMods(files)
  await addExternalMods(files)
  await addCustomFiles(files)

  const previousPaths = await fetchPreviousFilePaths()
  const currentPaths = new Set(files.map((f) => f.path))
  const diffRemoved = previousPaths.filter((p) => !currentPaths.has(p))
  const forceRemoved = (await loadForceRemovePaths()).filter((p) => !currentPaths.has(p))
  const removedPaths = Array.from(new Set([...diffRemoved, ...forceRemoved]))

  const packManifest = {
    packVersion: RELEASE_TAG,
    minecraftVersion: manifest.minecraft.version,
    neoforgeVersion: manifest.minecraft.modLoaders.find((m) => m.primary).id.replace(/^neoforge-/, ''),
    javaMajorVersion: 21,
    // `url` est un placeholder: il est corrigé après coup par patch-release-urls.mjs une fois les
    // assets réellement uploadés sur la release (GitHub peut renommer les fichiers, ex: espaces -> points).
    files: files.map((f) => ({ ...f, url: '' })),
    removedPaths,
    publishedAt: new Date().toISOString()
  }

  await writeFile(join(outDir, 'pack-manifest.json'), JSON.stringify(packManifest, null, 2))

  console.log(`\n${files.length} fichier(s) prêt(s) dans ${relative(repoRoot, outDir)}`)
  if (skipped.length) {
    console.log(`\n${skipped.length} mod(s) à ajouter manuellement dans modpack/overrides/mods/<projectID>.jar puis relancer:`)
    for (const s of skipped) {
      console.log(`  - modpack/overrides/mods/${s.projectID}.jar (actuellement ${s.fileName}, projet https://www.curseforge.com/minecraft/mc-mods/search?search=${s.projectID})`)
    }
  }
}

main()
