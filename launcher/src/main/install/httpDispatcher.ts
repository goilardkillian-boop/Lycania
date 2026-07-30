// Import direct depuis le sous-module, PAS depuis le point d'entrée `undici` : celui-ci exige
// aussi son magasin de cache SQLite (lib/cache/sqlite-cache-store.js), qui référence le module
// natif expérimental `node:sqlite`. Une fois empaqueté par electron-vite/Rollup, ce require se
// retrouve exécuté au chargement du process principal (et pas seulement si le cache SQLite est
// réellement utilisé, ce qui n'est jamais le cas ici), et plante au démarrage sur les versions
// d'Electron dont le Node embarqué ne fournit pas encore `node:sqlite`.
import Agent from 'undici/lib/dispatcher/agent'

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
