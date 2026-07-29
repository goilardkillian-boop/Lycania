import { useEffect } from 'react'
import { TIKTOK_URL } from '../constants'
import { TIKTOK_VIDEO_IDS } from '../tiktokVideos'

interface Props {
  open: boolean
  onClose: () => void
}

export function TikTokModal({ open, onClose }: Props): JSX.Element | null {
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-6 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Contenu TikTok de Lycania"
    >
      <div
        className="relative min-w-[380px] max-w-4xl overflow-hidden rounded-xl border border-lycania-border bg-lycania-panel p-5"
        style={{ maxHeight: '85vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 text-lycania-muted transition hover:text-lycania-blood"
          aria-label="Fermer"
        >
          ✕
        </button>
        <h2 className="mb-4 pr-8 font-display text-xl text-lycania-bone">@lycania.semirp sur TikTok</h2>

        {TIKTOK_VIDEO_IDS.length > 0 ? (
          <div className="flex max-h-[65vh] gap-4 overflow-x-auto pb-2">
            {TIKTOK_VIDEO_IDS.map((id) => (
              <iframe
                key={id}
                src={`https://www.tiktok.com/embed/v2/${id}`}
                className="h-[65vh] w-[325px] flex-shrink-0 rounded-lg border-0"
                allow="encrypted-media;"
                title={`Vidéo TikTok ${id}`}
              />
            ))}
          </div>
        ) : (
          <p className="max-w-sm py-8 text-center text-sm text-lycania-muted">
            Aucune vidéo configurée pour le moment.
          </p>
        )}

        <button
          onClick={() => window.lycania.app.openExternal(TIKTOK_URL)}
          className="mt-4 w-full rounded-lg border border-lycania-border py-2 text-xs font-medium text-lycania-bone
          transition hover:border-lycania-blood hover:shadow-[0_0_18px_-6px_theme(colors.lycania.blood)]"
        >
          Voir tout sur TikTok
        </button>
      </div>
    </div>
  )
}
