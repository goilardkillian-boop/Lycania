import { useState } from 'react'
import type { SignInProgress } from '@shared/types'
import logo from '../assets/logo.jpg'

interface Props {
  onSignIn: () => Promise<void>
  progress?: SignInProgress
  error?: string
}

export function Login({ onSignIn, progress, error }: Props): JSX.Element {
  const [pending, setPending] = useState(false)

  async function handleClick(): Promise<void> {
    setPending(true)
    try {
      await onSignIn()
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 px-10 text-center">
      <img src={logo} alt="Lycania" className="h-36 w-36 rounded-full object-cover shadow-[0_0_60px_-10px_theme(colors.lycania.blood)]" />

      <div className="max-w-md space-y-3">
        <h1 className="font-display text-3xl tracking-wide text-lycania-bone">Bienvenue à Lycania</h1>
        <p className="text-sm leading-relaxed text-lycania-muted">
          La lune rougeoie de nouveau. Connecte-toi avec ton compte Microsoft pour rejoindre le village
          avant que le Voile ne s'effondre.
        </p>
      </div>

      <button
        onClick={handleClick}
        disabled={pending}
        className="group relative overflow-hidden rounded-lg border border-lycania-border bg-lycania-panel px-8 py-3
        font-medium text-lycania-bone shadow-lg transition hover:border-lycania-blood hover:shadow-[0_0_25px_-5px_theme(colors.lycania.blood)]
        disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? (progress?.message ?? 'Connexion en cours…') : 'Se connecter avec Microsoft'}
      </button>

      {error && <p className="max-w-md text-sm text-lycania-blood">{error}</p>}

      <p className="text-xs text-lycania-muted">
        Un compte Microsoft possédant Minecraft: Java Edition est requis.
      </p>
    </div>
  )
}
