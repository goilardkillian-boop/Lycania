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
