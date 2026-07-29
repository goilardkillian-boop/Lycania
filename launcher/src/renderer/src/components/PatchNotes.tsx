import { useEffect, useState } from 'react'
import type { ChangelogEntry } from '@shared/types'

function Entry({ version, date, changes }: ChangelogEntry): JSX.Element {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-display text-sm tracking-wide text-lycania-bone">v{version}</h3>
        <span className="text-xs text-lycania-muted">{date}</span>
      </div>
      <ul className="mt-2 space-y-1.5">
        {changes.map((change, i) => (
          <li key={i} className="flex gap-2 text-xs leading-relaxed text-lycania-muted">
            <span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-lycania-blood" />
            <span>{change}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function PatchNotesCard(): JSX.Element {
  const [showAll, setShowAll] = useState(false)
  const [entries, setEntries] = useState<ChangelogEntry[]>()

  useEffect(() => {
    window.lycania.changelog.get().then(setEntries)
  }, [])

  const [latest, ...rest] = entries ?? []

  return (
    <div className="w-64 rounded-xl border border-lycania-border bg-lycania-panel/60 p-4">
      <p className="mb-3 text-xs uppercase tracking-widest text-lycania-wisteriaSoft">Nouveautés</p>
      {latest ? (
        <Entry {...latest} />
      ) : (
        <p className="text-xs text-lycania-muted">{entries ? 'Rien à signaler pour le moment.' : 'Chargement…'}</p>
      )}
      {rest.length > 0 && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-4 text-xs text-lycania-muted underline decoration-lycania-border underline-offset-4 transition hover:text-lycania-bone"
        >
          Voir tout l'historique
        </button>
      )}
      <PatchNotesModal open={showAll} onClose={() => setShowAll(false)} entries={entries ?? []} />
    </div>
  )
}

function PatchNotesModal({
  open,
  onClose,
  entries
}: {
  open: boolean
  onClose: () => void
  entries: ChangelogEntry[]
}): JSX.Element | null {
  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Historique des mises à jour"
    >
      <div
        className="relative max-h-[80vh] w-full max-w-md overflow-y-auto rounded-xl border border-lycania-border bg-lycania-panel p-6 shadow-[0_0_80px_-15px_theme(colors.lycania.blood)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-lycania-muted transition hover:text-lycania-blood"
          aria-label="Fermer"
        >
          ✕
        </button>
        <h2 className="mb-5 font-display text-xl text-lycania-bone">Historique des mises à jour</h2>
        <div className="space-y-6">
          {entries.map((entry) => (
            <Entry key={entry.version} {...entry} />
          ))}
        </div>
      </div>
    </div>
  )
}
