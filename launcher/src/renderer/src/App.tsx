import { useEffect, useState } from 'react'
import type { AuthState, InstallProgress, LauncherSettings, LaunchState, SignInProgress } from '@shared/types'
import { Login } from './screens/Login'
import { Home } from './screens/Home'
import { Settings } from './screens/Settings'

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

  useEffect(() => {
    window.lycania.auth.getState().then(setAuth)
    window.lycania.settings.get().then(setSettings)

    const offAuthState = window.lycania.auth.onState(setAuth)
    const offAuthProgress = window.lycania.auth.onProgress(setSignInProgress)
    const offInstall = window.lycania.install.onProgress(setInstallProgress)
    const offLaunchState = window.lycania.launch.onState(setLaunchState)
    const offLaunchLog = window.lycania.launch.onLog((line) => setLogLines((prev) => [...prev.slice(-500), line]))
    const offUpdateDownloaded = window.lycania.update.onDownloaded(setUpdateReady)

    return () => {
      offAuthState()
      offAuthProgress()
      offInstall()
      offLaunchState()
      offLaunchLog()
      offUpdateDownloaded()
    }
  }, [])

  async function handleSignIn(): Promise<void> {
    await window.lycania.auth.signIn()
  }

  async function handleSignOut(): Promise<void> {
    await window.lycania.auth.signOut()
  }

  async function handlePlay(): Promise<void> {
    setLogLines([])
    await window.lycania.install.start()
    await window.lycania.launch.start()
  }

  async function handleSaveSettings(patch: Partial<LauncherSettings>): Promise<void> {
    const next = await window.lycania.settings.set(patch)
    setSettings(next)
  }

  return (
    <div className="h-screen w-screen overflow-hidden">
      {updateReady && (
        <div className="flex items-center justify-between bg-lycania-blood px-4 py-1.5 text-xs text-white">
          <span>Une nouvelle version du launcher ({updateReady}) est prête.</span>
          <button onClick={() => window.lycania.update.installNow()} className="underline">
            Redémarrer maintenant
          </button>
        </div>
      )}

      {auth.status !== 'signed-in' && (
        <Login onSignIn={handleSignIn} progress={signInProgress} error={auth.status === 'error' ? auth.error : undefined} />
      )}

      {auth.status === 'signed-in' && auth.profile && settings && screen === 'home' && (
        <Home
          profile={auth.profile}
          onSignOut={handleSignOut}
          onOpenSettings={() => setScreen('settings')}
          onPlay={handlePlay}
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
