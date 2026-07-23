#!/usr/bin/env node
// Résout modpack/manifest.json (export CurseForge) via l'API officielle CurseForge, télécharge
// chaque mod, et prépare un dossier prêt à publier comme release GitHub sur lycania-files:
//   dist/release/<fichiers mods + overrides>
//   dist/release/pack-manifest.json
//
// Nécessite la variable d'environnement CURSEFORGE_API_KEY (voir README > "CurseForge API key").
// Conçu pour tourner dans GitHub Actions (accès réseau complet), pas dans le sandbox de dev.

import { createHash } from 'node:crypto'
import { createWriteStream, existsSync } from 'node:fs'
import { mkdir, readFile, readdir, writeFile, copyFile } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(__dirname, '..')

const CURSEFORGE_API_KEY = process.env.CURSEFORGE_API_KEY
const RELEASE_TAG = process.env.RELEASE_TAG // ex: pack-2026.07.23-1

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

async function listOverrideMods() {
  if (!existsSync(overridesModsDir)) return new Set()
  const entries = await readdir(overridesModsDir)
  return new Set(entries)
}

async function main() {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
  const overrideMods = await listOverrideMods()

  await mkdir(join(outDir, 'mods'), { recursive: true })

  const files = []
  const skipped = []

  for (const entry of manifest.files) {
    const { projectID, fileID } = entry
    try {
      const info = await curseforgeFile(projectID, fileID)
      const fileName = info.fileName

      if (overrideMods.has(fileName)) {
        const src = join(overridesModsDir, fileName)
        const dest = join(outDir, 'mods', fileName)
        await copyFile(src, dest)
        files.push({ path: `mods/${fileName}`, sha1: await sha1Of(dest), size: (await import('node:fs')).statSync(dest).size })
        console.log(`[override] ${fileName}`)
        continue
      }

      if (!info.downloadUrl) {
        skipped.push({ projectID, fileID, fileName })
        console.warn(`[SKIP] ${fileName} (projet ${projectID}) interdit de distribution tierce par l'auteur.`)
        continue
      }

      const dest = join(outDir, 'mods', fileName)
      await downloadTo(info.downloadUrl, dest)
      const sha1 = info.hashes?.find((h) => h.algo === 1)?.value?.toLowerCase() || (await sha1Of(dest))
      files.push({ path: `mods/${fileName}`, sha1, size: info.fileLength })
      console.log(`[ok] ${fileName}`)
    } catch (err) {
      console.error(`Erreur pour le mod ${projectID}/${fileID}:`, err.message)
      process.exitCode = 1
    }
  }

  const packManifest = {
    packVersion: RELEASE_TAG,
    minecraftVersion: manifest.minecraft.version,
    neoforgeVersion: manifest.minecraft.modLoaders.find((m) => m.primary).id.replace(/^neoforge-/, ''),
    javaMajorVersion: 21,
    // `url` est un placeholder: il est corrigé après coup par patch-release-urls.mjs une fois les
    // assets réellement uploadés sur la release (GitHub peut renommer les fichiers, ex: espaces -> points).
    files: files.map((f) => ({ ...f, url: '' })),
    removedPaths: [],
    publishedAt: new Date().toISOString()
  }

  await writeFile(join(outDir, 'pack-manifest.json'), JSON.stringify(packManifest, null, 2))

  console.log(`\n${files.length} fichier(s) prêt(s) dans ${relative(repoRoot, outDir)}`)
  if (skipped.length) {
    console.log(`\n${skipped.length} mod(s) à ajouter manuellement dans modpack/overrides/mods/ puis relancer:`)
    for (const s of skipped) console.log(`  - ${s.fileName} (https://www.curseforge.com/minecraft/mc-mods/search?search=${s.projectID})`)
  }
}

main()
