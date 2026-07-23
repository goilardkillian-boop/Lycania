import { useState } from 'react'
import type { LauncherSettings } from '@shared/types'

interface Props {
  settings: LauncherSettings
  onSave: (patch: Partial<LauncherSettings>) => Promise<void>
  onBack: () => void
}

export function Settings({ settings, onSave, onBack }: Props): JSX.Element {
  const [form, setForm] = useState(settings)
  const [saving, setSaving] = useState(false)

  async function persist(patch: Partial<LauncherSettings>): Promise<void> {
    const next = { ...form, ...patch }
    setForm(next)
    setSaving(true)
    try {
      await onSave(patch)
    } finally {
      setSaving(false)
    }
  }

  async function pickGameDirectory(): Promise<void> {
    const dir = await window.lycania.settings.pickGameDirectory()
    if (dir) await persist({ gameDirectory: dir })
  }

  async function pickJava(): Promise<void> {
    const path = await window.lycania.settings.pickJava()
    if (path) await persist({ javaPath: path })
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto px-8 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-2xl">Paramètres</h2>
        <button onClick={onBack} className="text-sm text-lycania-muted hover:text-lycania-bone">
          ← Retour
        </button>
      </div>

      <div className="space-y-6 pb-8">
        <section>
          <label className="mb-1 block text-sm text-lycania-muted">Adresse du serveur (connexion automatique)</label>
          <input
            value={form.serverAddress}
            onChange={(e) => setForm({ ...form, serverAddress: e.target.value })}
            onBlur={(e) => persist({ serverAddress: e.target.value })}
            placeholder="play.lycania.fr:25565"
            className="w-full rounded-lg border border-lycania-border bg-lycania-panel px-3 py-2 text-sm outline-none focus:border-lycania-blood"
          />
        </section>

        <section>
          <label className="mb-1 block text-sm text-lycania-muted">Dossier du jeu</label>
          <div className="flex gap-2">
            <input
              readOnly
              value={form.gameDirectory}
              className="flex-1 rounded-lg border border-lycania-border bg-lycania-panel px-3 py-2 text-sm text-lycania-muted"
            />
            <button onClick={pickGameDirectory} className="rounded-lg border border-lycania-border px-3 py-2 text-sm hover:border-lycania-blood">
              Changer
            </button>
          </div>
        </section>

        <section>
          <label className="mb-1 block text-sm text-lycania-muted">Java (laisser vide pour auto-détection)</label>
          <div className="flex gap-2">
            <input
              readOnly
              value={form.javaPath}
              placeholder="Automatique"
              className="flex-1 rounded-lg border border-lycania-border bg-lycania-panel px-3 py-2 text-sm text-lycania-muted"
            />
            <button onClick={pickJava} className="rounded-lg border border-lycania-border px-3 py-2 text-sm hover:border-lycania-blood">
              Choisir
            </button>
            {form.javaPath && (
              <button
                onClick={() => persist({ javaPath: '' })}
                className="rounded-lg border border-lycania-border px-3 py-2 text-sm hover:border-lycania-blood"
              >
                Réinitialiser
              </button>
            )}
          </div>
        </section>

        <section className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm text-lycania-muted">Mémoire minimale (Mo)</label>
            <input
              type="number"
              min={512}
              step={256}
              value={form.minMemoryMb}
              onChange={(e) => setForm({ ...form, minMemoryMb: Number(e.target.value) })}
              onBlur={(e) => persist({ minMemoryMb: Number(e.target.value) })}
              className="w-full rounded-lg border border-lycania-border bg-lycania-panel px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-lycania-muted">Mémoire maximale (Mo)</label>
            <input
              type="number"
              min={1024}
              step={256}
              value={form.maxMemoryMb}
              onChange={(e) => setForm({ ...form, maxMemoryMb: Number(e.target.value) })}
              onBlur={(e) => persist({ maxMemoryMb: Number(e.target.value) })}
              className="w-full rounded-lg border border-lycania-border bg-lycania-panel px-3 py-2 text-sm"
            />
          </div>
        </section>

        <section>
          <label className="mb-1 block text-sm text-lycania-muted">Arguments JVM additionnels (un par ligne)</label>
          <textarea
            value={form.extraJvmArgs}
            onChange={(e) => setForm({ ...form, extraJvmArgs: e.target.value })}
            onBlur={(e) => persist({ extraJvmArgs: e.target.value })}
            rows={3}
            className="w-full rounded-lg border border-lycania-border bg-lycania-panel px-3 py-2 font-mono text-xs"
          />
        </section>

        <section className="flex items-center gap-2">
          <input
            id="closeOnLaunch"
            type="checkbox"
            checked={form.closeOnLaunch}
            onChange={(e) => persist({ closeOnLaunch: e.target.checked })}
          />
          <label htmlFor="closeOnLaunch" className="text-sm text-lycania-muted">
            Fermer le launcher quand le jeu démarre
          </label>
        </section>

        {saving && <p className="text-xs text-lycania-muted">Enregistrement…</p>}
      </div>
    </div>
  )
}
