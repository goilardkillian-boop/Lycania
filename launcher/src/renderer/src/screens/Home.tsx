import { useMemo, useState } from 'react'
import type { GameProfile, InstallProgress, LaunchState } from '@shared/types'
import { ProgressBar } from '../components/ProgressBar'
import logo from '../assets/logo.jpg'

interface Props {
  profile: GameProfile
  onSignOut: () => void
  onOpenSettings: () => void
  onPlay: () => Promise<void>
  installProgress?: InstallProgress
  launchState: LaunchState
  logLines: string[]
}

const PHASE_LABELS: Record<InstallProgress['phase'], string> = {
  idle: '',
  checking: "Vérification de l'installation…",
  minecraft: 'Téléchargement de Minecraft…',
  neoforge: 'Installation de NeoForge…',
  java: 'Installation de Java…',
  'modpack-manifest': 'Vérification du modpack…',
  'modpack-files': 'Téléchargement des mods…',
  overrides: 'Application des configurations…',
  ready: 'Prêt.',
  error: "Erreur pendant l'installation."
}

export function Home({
  profile,
  onSignOut,
  onOpenSettings,
  onPlay,
  installProgress,
  launchState,
  logLines
}: Props): JSX.Element {
  const [showConsole, setShowConsole] = useState(false)

  const busy =
    (installProgress && installProgress.phase !== 'idle' && installProgress.phase !== 'ready' && installProgress.phase !== 'error') ||
    launchState.phase === 'preparing' ||
    launchState.phase === 'starting'

  const playLabel = useMemo(() => {
    if (launchState.phase === 'running') return 'En jeu…'
    if (launchState.phase === 'starting') return 'Démarrage…'
    if (launchState.phase === 'preparing') return 'Préparation…'
    if (installProgress && busy) return PHASE_LABELS[installProgress.phase] || 'Installation…'
    return 'Jouer'
  }, [installProgress, launchState.phase, busy])

  const avatarUrl = `https://crafatar.com/avatars/${profile.minecraftUuid}?size=64&overlay`

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-lycania-border/60 px-6 py-4">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Lycania" className="h-9 w-9 rounded-full object-cover" />
          <span className="font-display text-lg tracking-wide">Lycania</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <img src={avatarUrl} alt="" className="h-7 w-7 rounded" onError={(e) => (e.currentTarget.style.visibility = 'hidden')} />
            <span className="text-sm text-lycania-bone">{profile.minecraftUsername}</span>
          </div>
          <button onClick={onOpenSettings} className="text-sm text-lycania-muted hover:text-lycania-bone">
            Paramètres
          </button>
          <button onClick={onSignOut} className="text-sm text-lycania-muted hover:text-lycania-blood">
            Déconnexion
          </button>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-10">
        <blockquote className="max-w-lg text-center text-sm italic leading-relaxed text-lycania-muted">
          « La lune deviendra rouge pour la première fois depuis des siècles, et le monde que vous
          connaissez basculera. »
        </blockquote>

        <button
          onClick={onPlay}
          disabled={busy || launchState.phase === 'running'}
          className="rounded-xl border border-lycania-border bg-lycania-panel px-14 py-4 text-lg font-semibold tracking-wide
          text-lycania-bone shadow-xl transition hover:border-lycania-blood hover:shadow-[0_0_35px_-8px_theme(colors.lycania.blood)]
          disabled:cursor-not-allowed disabled:opacity-70"
        >
          {playLabel}
        </button>

        {installProgress && busy && (
          <div className="w-full max-w-md">
            <ProgressBar progress={installProgress.progress} label={installProgress.detail ?? PHASE_LABELS[installProgress.phase]} />
          </div>
        )}

        {installProgress?.phase === 'error' && (
          <p className="max-w-md text-center text-sm text-lycania-blood">{installProgress.error}</p>
        )}
        {launchState.phase === 'error' && (
          <p className="max-w-md text-center text-sm text-lycania-blood">{launchState.error}</p>
        )}

        <button onClick={() => setShowConsole((v) => !v)} className="text-xs text-lycania-muted underline">
          {showConsole ? 'Masquer' : 'Afficher'} la console
        </button>
      </main>

      {showConsole && (
        <div className="h-40 overflow-y-auto border-t border-lycania-border/60 bg-black/40 px-4 py-2 font-mono text-[11px] text-lycania-muted">
          {logLines.length === 0 ? <p>Aucune sortie pour le moment.</p> : logLines.map((line, i) => <div key={i}>{line}</div>)}
        </div>
      )}
    </div>
  )
}
