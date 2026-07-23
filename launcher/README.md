# Lycania Launcher

Launcher desktop (Electron + React + TypeScript) pour le serveur Lycania — Minecraft 1.21.1 /
NeoForge 21.1.238.

## Fonctionnalités

- Connexion **Microsoft obligatoire** (Authorization Code + PKCE, redirection loopback locale —
  aucun mot de passe ne transite par le launcher), avec la chaîne complète Xbox Live → XSTS →
  Minecraft Services, vérification de possession du jeu et récupération du profil/skin.
- Installation automatique de Minecraft, du runtime Java requis et de NeoForge.
- Synchronisation du modpack (mods + configs) depuis les releases GitHub du dépôt `lycania-files`,
  avec vérification par hash et connexion automatique au serveur (Quick Play).
- Auto-update du launcher lui-même via GitHub Releases.

## Architecture

```
src/
  main/           processus principal Electron (Node): auth, install, sync, launch, IPC
    auth/         Microsoft OAuth (PKCE loopback) -> Xbox Live -> XSTS -> Minecraft Services
    install/      Minecraft + NeoForge + Java (via @xmcl/core et @xmcl/installer)
    modpack/      synchronisation depuis les releases GitHub de lycania-files
    launch/       assemblage des options de lancement et spawn du process Minecraft
    settings/     persistance des préférences utilisateur
    update/       auto-update (electron-updater, provider GitHub)
  preload/        pont contextBridge exposant une API typée (window.lycania) au renderer
  renderer/       interface React (écrans connexion / accueil / paramètres)
  shared/         types partagés entre les 3 processus (contrat IPC)
```

## Prérequis

- Node.js 22+
- Un compte GitHub avec accès à `goilardkillian-boop/Lycania` et `goilardkillian-boop/lycania-files`

## Configuration

Copie `.env.example` vers `.env` à la racine de `launcher/` et renseigne:

| Variable | Description |
| --- | --- |
| `MAIN_VITE_AZURE_CLIENT_ID` | Client ID de l'app Azure AD utilisée pour la connexion Microsoft (obligatoire, voir ci-dessous). |
| `MAIN_VITE_MODPACK_REPO` | `owner/repo` où sont publiées les releases du modpack (défaut: `goilardkillian-boop/lycania-files`). |
| `MAIN_VITE_LAUNCHER_REPO` | `owner/repo` où sont publiées les releases du launcher, pour l'auto-update (défaut: `goilardkillian-boop/Lycania`). |

### Créer l'application Azure AD (connexion Microsoft)

Minecraft/Xbox exige que chaque launcher tiers ait sa propre application enregistrée auprès de
Microsoft (c'est gratuit) :

1. Va sur https://portal.azure.com > **Azure Active Directory** > **Inscriptions d'applications** >
   **Nouvelle inscription**.
2. Nom: `Lycania Launcher` (libre).
3. **Types de comptes pris en charge**: choisis *"Comptes dans n'importe quel annuaire
   organisationnel et comptes Microsoft personnels"* (indispensable pour Xbox Live).
4. **URI de redirection**: type **Mobile et applications de bureau**, valeur `http://localhost`.
5. Une fois créée, copie le **ID d'application (client)** affiché sur la page d'aperçu → c'est ta
   `MAIN_VITE_AZURE_CLIENT_ID`.
6. Dans **Authentification** de l'app, vérifie que `http://localhost` est bien listé comme URI de
   redirection "Mobile et applications de bureau" (le launcher utilise un port aléatoire sur
   `127.0.0.1`, Microsoft accepte `http://localhost` comme préfixe générique pour ce type de client).
7. Aucun secret client n'est nécessaire (l'app est un "client public").

Cette app permet uniquement la connexion (scope `XboxLive.signin offline_access`) — elle n'a besoin
d'aucune autre permission API.

### Secrets/variables GitHub Actions à configurer sur ce dépôt

Dans **Settings > Secrets and variables > Actions** du dépôt `Lycania` :

| Nom | Type | Utilisation |
| --- | --- | --- |
| `AZURE_CLIENT_ID` | secret | Injecté dans `.env` lors du build du launcher en CI. |
| `CURSEFORGE_API_KEY` | secret | Requis par `sync-modpack.yml` pour résoudre les mods via l'API CurseForge. À obtenir sur https://console.curseforge.com/ (compte gratuit, section "API Keys"). |
| `LYCANIA_FILES_TOKEN` | secret | Personal Access Token (scope `repo`) avec accès en écriture à `lycania-files`, pour que `sync-modpack.yml` (qui tourne dans le dépôt `Lycania`) puisse y créer des releases. Le `GITHUB_TOKEN` par défaut ne peut pas écrire dans un autre dépôt. |
| `MODPACK_FILES_REPO` | variable | Optionnel, défaut `goilardkillian-boop/lycania-files`. |

## Développement local

```bash
cd launcher
npm install
npm run dev
```

## Build & publication du launcher

Le workflow `.github/workflows/build-release.yml` build et publie automatiquement le launcher
(Windows/macOS/Linux) sur les GitHub Releases de ce dépôt à chaque tag `v*` poussé (`git tag v0.1.0
&& git push origin v0.1.0`), ou manuellement via "Run workflow".

En local, sans publication :

```bash
npm run pack:win    # ou pack:mac / pack:linux
```

## Publier une mise à jour du modpack

1. Mets à jour `modpack/manifest.json` (ré-exporte depuis CurseForge si la liste de mods change).
2. Lance manuellement le workflow **Sync modpack to lycania-files** (onglet Actions), en donnant un
   tag de release (ex: `pack-2026.07.23-1`).
3. Le workflow résout chaque mod via l'API CurseForge, télécharge les fichiers, et publie une
   release sur `lycania-files` avec les mods + un `pack-manifest.json`. Le launcher détecte la
   nouvelle version au prochain lancement et met à jour les mods automatiquement (par hash).

**Mods qui refusent la distribution tierce** : certains auteurs désactivent la distribution via API
CurseForge. Le script `scripts/sync-modpack.mjs` les liste en fin d'exécution (logs du workflow).
Pour ces mods-là uniquement : télécharge le jar manuellement, place-le dans
`modpack/overrides/mods/<nom-exact-du-fichier>.jar`, commit, puis relance le workflow — ces fichiers
sont repris tels quels au lieu d'être demandés à l'API.

## Limites connues de cet environnement de développement

Ce launcher a été écrit et compilé (typecheck + build electron-vite) dans un environnement sandbox
dont la politique réseau bloque `api.minecraftservices.com`, `*.xboxlive.com` et l'API/CDN
CurseForge — uniquement pour cet environnement de dev, pas pour les utilisateurs finaux. Concrètement :

- La chaîne d'authentification Microsoft → Xbox Live → XSTS → Minecraft Services est implémentée
  selon le protocole officiel documenté par Microsoft, mais n'a pas pu être testée de bout en bout
  avec un vrai compte ici. **Teste la connexion sur une machine avec un accès réseau normal** avant
  de distribuer le launcher.
- Idem pour le téléchargement réel de Minecraft/NeoForge/Java (les appels à Mojang ont pu être
  vérifiés partiellement — `launchermeta.mojang.com` est joignable — mais pas un run complet).
- Le script `sync-modpack.mjs` n'a pas pu être exécuté contre la vraie API CurseForge ici (elle
  tourne dans GitHub Actions, qui a un accès réseau complet).

Tout le code TypeScript compile (`npm run typecheck`) et le bundle complet (main + preload +
renderer) se construit sans erreur (`npm run build`).
