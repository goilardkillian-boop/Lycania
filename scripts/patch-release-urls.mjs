#!/usr/bin/env node
// Une fois les assets uploadés sur la release GitHub (mods + pack-manifest.json), corrige les URLs
// de pack-manifest.json avec les vraies browser_download_url (GitHub peut renommer les fichiers,
// par ex. remplacer les espaces par des points), puis ré-uploade le manifeste corrigé.
//
// Usage: node scripts/patch-release-urls.mjs <chemin-vers-pack-manifest.json> <chemin-vers-assets.json>
// où assets.json vient de: gh api repos/<owner>/<repo>/releases/tags/<tag> --jq '.assets'

import { readFile, writeFile } from 'node:fs/promises'
import { basename } from 'node:path'

const [manifestPath, assetsPath] = process.argv.slice(2)
if (!manifestPath || !assetsPath) {
  console.error('Usage: node scripts/patch-release-urls.mjs <pack-manifest.json> <assets.json>')
  process.exit(1)
}

const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
const assets = JSON.parse(await readFile(assetsPath, 'utf8'))

const urlByName = new Map(assets.map((a) => [a.name, a.browser_download_url]))

let missing = 0
for (const file of manifest.files) {
  const name = basename(file.path)
  const url = urlByName.get(name)
  if (!url) {
    console.error(`Aucun asset uploadé ne correspond à ${name}`)
    missing += 1
    continue
  }
  file.url = url
}

if (missing > 0) {
  console.error(`${missing} fichier(s) sans URL correspondante.`)
  process.exit(1)
}

await writeFile(manifestPath, JSON.stringify(manifest, null, 2))
console.log(`pack-manifest.json corrigé avec ${manifest.files.length} URL(s).`)
