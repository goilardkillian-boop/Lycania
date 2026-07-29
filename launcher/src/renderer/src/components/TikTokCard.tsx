import { useState } from 'react'
import { TIKTOK_HANDLE } from '../constants'
import { TikTokModal } from './TikTokModal'

/**
 * Glyphe original (pas le logo TikTok, qui est une marque déposée) évoquant simplement
 * une note de musique dans un cadre, cohérent avec le thème du launcher.
 */
function ClipIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <path d="M10 15.5a2.5 2.5 0 1 1-1.5-2.29" />
      <path d="M10 15.5V8l5 1.4" />
    </svg>
  )
}

export function TikTokCard(): JSX.Element {
  const [open, setOpen] = useState(false)

  return (
    <div className="w-64 rounded-xl border border-lycania-border bg-lycania-panel/60 p-4">
      <p className="mb-3 flex items-center gap-2 text-xs uppercase tracking-widest text-lycania-wisteriaSoft">
        <ClipIcon />
        Contenu
      </p>
      <p className="font-display text-sm text-lycania-bone">{TIKTOK_HANDLE}</p>
      <p className="mt-2 text-xs leading-relaxed text-lycania-muted">
        Builds, ambiance et coulisses du serveur, en clips courts.
      </p>
      <button
        onClick={() => setOpen(true)}
        className="mt-4 w-full rounded-lg border border-lycania-border py-2 text-xs font-medium text-lycania-bone
        transition hover:border-lycania-blood hover:shadow-[0_0_18px_-6px_theme(colors.lycania.blood)]"
      >
        Voir les vidéos
      </button>

      <TikTokModal open={open} onClose={() => setOpen(false)} />
    </div>
  )
}
