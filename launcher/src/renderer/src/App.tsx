import { useEffect, useState } from 'react'
import type { AuthState, InstallProgress, LauncherSettings, LaunchState, SignInProgress } from '@shared/types'
import { Login } from './screens/Login'
import { Home } from './screens/Home'
import { Settings } from './screens/Settings'
import { BackgroundScene } from './components/BackgroundScene'

type Screen = 'home' | 'settings'

export default function App(): JSX.Element {
  const [auth, setAuth] = useState<AuthState>({ status: 'signed-out' })
  const [signInProgress, setSignInProgress] = useState<SignInProgress>()
  const [installProgress, setInstallProgress] = useState<InstallProgress>()
  const [launchState, setLaunchState] = useState<LaunchState>({ phase: 'idle' })
  const [logLines, setLogLines] = useState<string[]>([])
  const [settings, setSettings] = useState<LauncherSettings>()
  const [screen, setScreen] = useState<Screen>('home')
  const [updateReady, setUpdateReady] = useState<string>()
  const [updateGate, setUpdateGate] = useState<'idle' | 'checking' | 'installing'>('idle')
  const [updatePercent, setUpdatePercent] = useState(0)

  useEffect(() => {
    window.lycania.auth.getState().then(setAuth)
    window.lycania.settings.get().then(setSettings)

    const offAuthState = window.lycania.auth.onState(setAuth)
    const offAuthProgress = window.lycania.auth.onProgress(setSignInProgress)
    const offInstall = window.lycania.install.onProgress(setInstallProgress)
    const offLaunchState = window.lycania.launch.onState(setLaunchState)
    const offLaunchLog = window.lycania.launch.onLog((line) => setLogLines((prev) => [...prev.slice(-500), line]))
    const offUpdateDownloaded = window.lycania.update.onDownloaded(setUpdateReady)
    const offUpdateProgress = window.lycania.update.onProgress(setUpdatePercent)

    return () => {
      offAuthState()
      offAuthProgress()
      offInstall()
      offLaunchState()
      offLaunchLog()
      offUpdateDownloaded()
      offUpdateProgress()
    }
  }, [])

  const [trainProgress, setTrainProgress] = useState(0)

  function handleTrainLetterHit(letter: string): void {
    const sequence = ['T', 'R', 'A', 'I', 'N']
    setTrainProgress((prev) => {
      if (letter === sequence[prev]) {
        const next = prev + 1
        if (next === sequence.length) {
          window.lycania.app.openExternal('https://www.sncf-connect.com/')
          return 0
        }
        return next
      }
      // Un clic hors séquence relance depuis le début si c'était bien un "T".
      return letter === sequence[0] ? 1 : 0
    })
  }

  async function handleSignIn(): Promise<void> {
    await window.lycania.auth.signIn()
  }

  async function handleSignOut(): Promise<void> {
    await window.lycania.auth.signOut()
  }

  const [starting, setStarting] = useState(false)

  async function handlePlay(): Promise<void> {
    // Le bouton ne se désactive (via installProgress/launchState) qu'une fois le premier
    // événement IPC reçu, ce qui laisse une fenêtre où un double-clic déclenche deux
    // installations/lancements en parallèle. Ce verrou local coupe court dès le premier clic.
    if (starting) return
    setStarting(true)
    try {
      // Mise à jour obligatoire avant de pouvoir jouer : impossible de continuer sur une
      // version obsolète du launcher. Si une mise à jour est trouvée, l'app redémarre d'elle
      // même pour l'installer, donc cette fonction ne va simplement jamais plus loin dans ce cas.
      setUpdateGate('checking')
      const updateResult = await window.lycania.update.checkBeforePlay().catch(() => 'up-to-date' as const)
      if (updateResult === 'installing') {
        setUpdateGate('installing')
        return
      }
      setUpdateGate('idle')

      setLogLines([])
      await window.lycania.install.start()
      await window.lycania.launch.start()
    } catch {
      // L'état d'erreur détaillé est déjà diffusé via installOnProgress / launchOnState.
    } finally {
      setStarting(false)
    }
  }

  async function handleSaveSettings(patch: Partial<LauncherSettings>): Promise<void> {
    const next = await window.lycania.settings.set(patch)
    setSettings(next)
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <BackgroundScene />

      {updateGate !== 'idle' && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-black/90 backdrop-blur-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-lycania-border border-t-lycania-blood" />
          <p className="font-display text-lg text-lycania-bone">
            {updateGate === 'checking' ? 'Vérification des mises à jour…' : 'Mise à jour en cours…'}
          </p>
          {updateGate === 'installing' && (
            <p className="max-w-sm text-center text-sm text-lycania-muted">
              Une nouvelle version du launcher est nécessaire pour jouer. Elle est en cours d'installation
              ({updatePercent.toFixed(0)}%), le launcher va redémarrer automatiquement.
            </p>
          )}
        </div>
      )}

      {updateReady && (
        <div className="flex items-center justify-between bg-lycania-blood px-4 py-1.5 text-xs text-white">
          <span>Une nouvelle version du launcher ({updateReady}) est prête.</span>
          <button onClick={() => window.lycania.update.installNow()} className="underline">
            Redémarrer maintenant
          </button>
        </div>
      )}

      {auth.status !== 'signed-in' && (
        <Login
          onSignIn={handleSignIn}
          progress={signInProgress}
          error={auth.status === 'error' ? auth.error : undefined}
          onTrainLetterHit={handleTrainLetterHit}
        />
      )}

      {auth.status === 'signed-in' && auth.profile && settings && screen === 'home' && (
        <Home
          profile={auth.profile}
          onSignOut={handleSignOut}
          onOpenSettings={() => setScreen('settings')}
          onPlay={handlePlay}
          starting={starting}
          installProgress={installProgress}
          launchState={launchState}
          logLines={logLines}
        />
      )}

      {auth.status === 'signed-in' && settings && screen === 'settings' && (
        <Settings settings={settings} onSave={handleSaveSettings} onBack={() => setScreen('home')} />
      )}
    </div>
  )
}
