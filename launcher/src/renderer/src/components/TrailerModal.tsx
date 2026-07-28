import { useEffect } from 'react'
import trailerSrc from '../assets/video/trailer.mp4'

interface Props {
  open: boolean
  onClose: () => void
}

export function TrailerModal({ open, onClose }: Props): JSX.Element | null {
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
      aria-label="Bande-annonce de Lycania"
    >
      <div
        className="relative w-full max-w-3xl overflow-hidden rounded-xl border border-lycania-border bg-black shadow-[0_0_90px_-10px_theme(colors.lycania.blood)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-full bg-black/60 px-2.5 py-1 text-sm text-lycania-bone transition hover:text-lycania-blood"
          aria-label="Fermer"
        >
          ✕
        </button>
        <video src={trailerSrc} controls autoPlay className="block aspect-video w-full bg-black" />
      </div>
    </div>
  )
}
