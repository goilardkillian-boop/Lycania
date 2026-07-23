// Types partagés entre le processus principal, le preload et le renderer.
// Ne rien importer ici qui dépende de Node ou du DOM : ce fichier doit rester isomorphe.

export interface GameProfile {
  minecraftUuid: string
  minecraftUsername: string
  skinUrl?: string
}

export type AuthStatus = 'signed-out' | 'signing-in' | 'signed-in' | 'error'

export interface AuthState {
  status: AuthStatus
  profile?: GameProfile
  error?: string
}

export type SignInStage =
  | 'opening-browser'
  | 'waiting-for-microsoft'
  | 'xbox-live'
  | 'xsts'
  | 'minecraft-services'
  | 'checking-ownership'
  | 'fetching-profile'
  | 'done'

export interface SignInProgress {
  stage: SignInStage
  message: string
}

export type InstallPhase =
  | 'idle'
  | 'checking'
  | 'minecraft'
  | 'neoforge'
  | 'java'
  | 'modpack-manifest'
  | 'modpack-files'
  | 'overrides'
  | 'ready'
  | 'error'

export interface InstallProgress {
  phase: InstallPhase
  /** 0-1, undefined when indeterminate */
  progress?: number
  detail?: string
  currentFile?: string
  filesDone?: number
  filesTotal?: number
  error?: string
}

export type LaunchPhase = 'idle' | 'preparing' | 'starting' | 'running' | 'exited' | 'error'

export interface LaunchState {
  phase: LaunchPhase
  exitCode?: number | null
  error?: string
}

export interface LauncherSettings {
  /** Chemin du dossier .minecraft utilisé par le launcher */
  gameDirectory: string
  /** Mémoire allouée à la JVM, en Mo */
  minMemoryMb: number
  maxMemoryMb: number
  /** Chemin vers un exécutable java personnalisé, vide = auto */
  javaPath: string
  /** Adresse du serveur pour la connexion automatique (Quick Play), ex: play.lycania.fr:25565 */
  serverAddress: string
  /** Arguments JVM additionnels, un par ligne */
  extraJvmArgs: string
  /** Fermer le launcher quand le jeu démarre */
  closeOnLaunch: boolean
}

export interface ModpackFileEntry {
  /** Chemin relatif dans le dossier .minecraft, ex: mods/xyz.jar */
  path: string
  /** URL de téléchargement (asset de release GitHub) */
  url: string
  sha1: string
  size: number
}

export interface PackManifest {
  packVersion: string
  minecraftVersion: string
  neoforgeVersion: string
  /** Version de Java requise (ex: 21) */
  javaMajorVersion: number
  files: ModpackFileEntry[]
  /** Chemins qui ne doivent plus exister après sync (mods retirés du pack) */
  removedPaths?: string[]
  publishedAt: string
}

export interface AppVersionInfo {
  launcherVersion: string
}

export const IPC = {
  authGetState: 'auth:get-state',
  authSignIn: 'auth:sign-in',
  authSignOut: 'auth:sign-out',
  authOnState: 'auth:on-state',
  authOnProgress: 'auth:on-progress',

  installCheck: 'install:check',
  installStart: 'install:start',
  installOnProgress: 'install:on-progress',

  launchStart: 'launch:start',
  launchOnState: 'launch:on-state',
  launchOnLog: 'launch:on-log',

  settingsGet: 'settings:get',
  settingsSet: 'settings:set',
  settingsPickGameDirectory: 'settings:pick-game-directory',
  settingsPickJava: 'settings:pick-java',

  updateOnAvailable: 'update:on-available',
  updateOnProgress: 'update:on-progress',
  updateOnDownloaded: 'update:on-downloaded',
  updateInstallNow: 'update:install-now',

  appGetVersionInfo: 'app:get-version-info',
  appOpenExternal: 'app:open-external'
} as const
