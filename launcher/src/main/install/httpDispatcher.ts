import { Agent } from 'undici'

/**
 * Les téléchargements de Minecraft/NeoForge/Java n'ont par défaut aucun timeout : si une
 * connexion reste ouverte sans plus jamais transmettre le moindre octet (pare-feu capricieux,
 * coupure réseau sans fermeture propre), la tâche reste bloquée indéfiniment, avec la barre de
 * progression figée et sans jamais afficher d'erreur. headersTimeout/bodyTimeout sont réarmés à
 * chaque octet reçu : ils n'interrompent donc pas les téléchargements lents mais actifs, seulement
 * ceux qui se sont réellement arrêtés.
 */
export const installDispatcher = new Agent({
  connectTimeout: 15_000,
  headersTimeout: 30_000,
  bodyTimeout: 30_000
})
