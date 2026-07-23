// Centralise la lecture des variables d'environnement injectées au build par electron-vite
// (préfixe MAIN_VITE_, voir .env.example). Ce module est le seul point qui touche import.meta.env
// côté processus principal.

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Variable d'environnement manquante: ${name}. Copie .env.example vers .env et renseigne-la (voir README).`
    )
  }
  return value
}

export const config = {
  /** Client ID de l'application Azure AD (Mobile and desktop applications, redirect http://localhost) */
  get azureClientId(): string {
    return required('MAIN_VITE_AZURE_CLIENT_ID', import.meta.env.MAIN_VITE_AZURE_CLIENT_ID)
  },
  /** owner/repo GitHub où sont publiées les releases du modpack (mods + pack-manifest.json) */
  get modpackRepo(): string {
    return import.meta.env.MAIN_VITE_MODPACK_REPO || 'goilardkillian-boop/lycania-files'
  },
  /** owner/repo GitHub où sont publiées les releases du launcher lui-même (auto-update) */
  get launcherRepo(): string {
    return import.meta.env.MAIN_VITE_LAUNCHER_REPO || 'goilardkillian-boop/Lycania'
  }
}
