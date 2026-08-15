/**
 * Quand @xmcl/installer échoue à télécharger plusieurs fichiers en parallèle (assets, libs), il
 * lève un AggregateError sans message ("") avec le détail dans `.errors`. err.message serait donc
 * vide et l'utilisateur ne verrait littéralement rien s'afficher, malgré l'échec bien réel. On
 * remonte ici le détail des erreurs sous-jacentes pour toujours avoir un message utile.
 */
export function errorMessageOf(err: unknown): string {
  if (err instanceof AggregateError) {
    const messages = Array.from(new Set(err.errors.map((e) => errorMessageOf(e)).filter(Boolean)))
    if (messages.length === 0) return err.message || 'Erreur inconnue.'
    const shown = messages.slice(0, 3)
    const suffix = messages.length > shown.length ? ` (+${messages.length - shown.length} autre(s))` : ''
    return shown.join(' · ') + suffix
  }
  if (err instanceof Error) return err.message || err.constructor.name
  return String(err)
}
