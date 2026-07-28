import { useState } from 'react'
import type { SignInProgress } from '@shared/types'
import logo from '../assets/logo.jpg'
import { TrailerModal } from '../components/TrailerModal'
import { TrainLetter } from '../components/TrainLetter'
import { SITE_URL } from '../constants'

interface Props {
  onSignIn: () => Promise<void>
  progress?: SignInProgress
  error?: string
  onTrainLetterHit: (letter: string) => void
}

export function Login({ onSignIn, progress, error, onTrainLetterHit }: Props): JSX.Element {
  const [pending, setPending] = useState(false)
  const [showLore, setShowLore] = useState(false)
  const [showTrailer, setShowTrailer] = useState(false)

  async function handleClick(): Promise<void> {
    setPending(true)
    try {
      await onSignIn()
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="relative flex h-full items-center justify-center overflow-y-auto px-8 py-10">
      <div className="pointer-events-none absolute left-1/2 top-16 h-72 w-72 -translate-x-1/2 rounded-full bg-lycania-blood/20 blur-[100px]" />

      <div className="relative flex w-full max-w-lg flex-col items-center gap-6 text-center">
        <img
          src={logo}
          alt="Lycania"
          className="h-32 w-32 rounded-full object-cover ring-1 ring-lycania-border shadow-[0_0_60px_-8px_theme(colors.lycania.blood)]"
        />

        <div>
          <h1 className="font-display text-4xl tracking-wide text-lycania-bone">Lycania</h1>
          <p className="mt-1 font-serif text-lg italic text-lycania-wisteriaSoft">Le Voile s'effondre</p>
        </div>

        <p className="max-w-md font-serif text-base leading-relaxed text-lycania-muted">
          {'La lune deviendra rouge pour la première fois depuis des siècles. Les clans des Loups, des Vampires e'}
          <TrainLetter letter="T" char="t" onHit={onTrainLetterHit} />
          {' des Chasseu'}
          <TrainLetter letter="R" char="r" onHit={onTrainLetterHit} />
          {'s vont ren'}
          <TrainLetter letter="A" char="a" onHit={onTrainLetterHit} />
          {'ître. Un rôle te sera attr'}
          <TrainLetter letter="I" char="i" onHit={onTrainLetterHit} />
          {'bué. Sauras-tu détecter les créatures maléfiques parmi les tie'}
          <TrainLetter letter="N" char="n" onHit={onTrainLetterHit} />
          {'s, et surtout, survivras-tu ?'}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <button
            onClick={() => setShowLore((v) => !v)}
            className="text-xs uppercase tracking-widest text-lycania-wisteriaSoft transition hover:text-lycania-bone"
          >
            {showLore ? 'Replier le récit' : 'Découvrir le récit'}
          </button>
          <button
            onClick={() => setShowTrailer(true)}
            className="text-xs uppercase tracking-widest text-lycania-wisteriaSoft transition hover:text-lycania-bone"
          >
            Voir la bande-annonce
          </button>
        </div>

        {showLore && (
          <blockquote className="max-w-md border-l-2 border-lycania-border pl-4 text-left font-serif text-sm italic leading-relaxed text-lycania-muted">
            Il y a près de neuf siècles, trois enfants réveillèrent une magie oubliée au cœur de la
            forêt. Cette nuit là, le ciel se teinta de rouge et la malédiction s'abattit sur le
            village. De leur sacrifice naquit la Pierre de Clair de Lune, une relique qui endormit la
            malédiction et ramena la paix pendant près de neuf siècles. Aujourd'hui, la Pierre a
            disparu. Le Voile s'effondre lentement, et les premières transformations reviennent.
          </blockquote>
        )}

        <button
          onClick={handleClick}
          disabled={pending}
          className="mt-2 group relative overflow-hidden rounded-lg border border-lycania-border bg-lycania-panel px-8 py-3
          font-medium text-lycania-bone shadow-lg transition hover:border-lycania-blood hover:shadow-[0_0_25px_-5px_theme(colors.lycania.blood)]
          disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? (progress?.message ?? 'Connexion en cours…') : 'Se connecter avec Microsoft'}
        </button>

        {error && <p className="max-w-md text-sm text-lycania-blood">{error}</p>}

        <p className="text-xs text-lycania-muted">
          Un compte Microsoft possédant Minecraft: Java Edition est requis.
        </p>

        <button
          onClick={() => window.lycania.app.openExternal(SITE_URL)}
          className="text-xs text-lycania-muted underline decoration-lycania-border underline-offset-4 transition hover:text-lycania-bone"
        >
          Visiter le site de Lycania
        </button>
      </div>

      <TrailerModal open={showTrailer} onClose={() => setShowTrailer(false)} />
    </div>
  )
}
