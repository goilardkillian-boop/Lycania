# Lycania

Serveur Minecraft (1.21.1 / NeoForge) et son launcher officiel.

## Structure du dépôt

- **`launcher/`** — Launcher desktop (Electron + React + TypeScript) : connexion Microsoft
  obligatoire, installation automatique de Minecraft/NeoForge/Java, synchronisation du modpack,
  lancement du jeu, auto-update. Voir [`launcher/README.md`](launcher/README.md) pour tout ce qui
  concerne la configuration et le build.
- **`modpack/`** — Export CurseForge du modpack (`manifest.json`, `modlist.html`, logo). C'est la
  source de vérité utilisée par le workflow de synchronisation.
- **`scripts/`** — Scripts utilisés par les GitHub Actions pour résoudre le modpack via l'API
  CurseForge et publier les mods sur le dépôt [`lycania-files`](https://github.com/goilardkillian-boop/lycania-files).
- **`.github/workflows/`** — CI: build/release du launcher, synchronisation du modpack.

## Où sont hébergés les mods ?

Les ~140 mods du modpack ne sont pas commités dans ce dépôt (ça le ferait exploser). Le workflow
`sync-modpack.yml` résout `modpack/manifest.json` via l'API CurseForge et publie les fichiers comme
release GitHub sur le dépôt séparé `lycania-files`. Le launcher télécharge ensuite les mods depuis
cette release au premier lancement et à chaque mise à jour du pack.

Trois façons d'ajouter un mod, selon sa provenance :

- **Sur CurseForge** (cas normal) : ajouter une entrée `{projectID, fileID}` dans
  `modpack/manifest.json`. Rien à commiter, le fichier est résolu via l'API CurseForge à chaque
  sync.
- **Mod maison, jamais publié nulle part** : déposer le `.jar` dans `modpack/custom-mods/`. Repris
  tel quel, sans configuration.
- **Absent de CurseForge mais téléchargeable directement** (ex: exclusivité Modrinth) : ajouter une
  entrée dans `modpack/external-mods.json` (`fileName`, `url`, `sha1`, `size`, `folder` optionnel).
  Téléchargé à chaque sync depuis l'URL donnée, jamais commité ici — c'est la seule option pour un
  fichier qui dépasse la limite de 100 Mo de GitHub par fichier commité.

## Retirer un mod : et si un joueur a raté la release qui le retire ?

`pack-manifest.json` liste un `removedPaths` calculé par diff avec la release *immédiatement
précédente*. Un joueur dont le launcher saute plusieurs releases d'un coup (cas normal, il ne
récupère toujours que la dernière) peut rater un retrait signalé uniquement dans une release
intermédiaire, et se retrouver avec un mod orphelin que plus aucune release ne redemande de
supprimer. Si ça arrive : ajouter le chemin (ex: `mods/MonMod-1.0.jar`) dans
`modpack/force-remove.json`, toujours inclus dans `removedPaths` à chaque sync tant qu'il y est.
À retirer de ce fichier une fois que le mod ne traîne plus chez personne.
