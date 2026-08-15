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
 *
 * `connections` plafonne le nombre de connexions simultanées par origine. @xmcl/installer télécharge
 * les assets (des milliers de petits fichiers pour une premi​ère installation) via un
 * Promise.allSettled sans aucune limite de parallélisme : sans ce plafond, le launcher ouvre
 * potentiellement des milliers de connexions HTTPS d'un coup vers resources.download.minecraft.net.
 * Sans incidence sur une bonne connexion/un bon PC (d'où le fait que ça marche "très bien" en test),
 * mais ça sature la table NAT de routeurs grand public ou se fait bloquer par un antivirus chez de
 * nombreux joueurs qui installent pour la première fois — d'où les échecs rapides ou les blocages
 * silencieux constatés. undici met ces requêtes en file d'attente au lieu de les envoyer toutes
 * en même temps, sans changer le code appelant.
 */
export const installDispatcher = new Agent({
  connectTimeout: 15_000,
  headersTimeout: 30_000,
  bodyTimeout: 30_000,
  connections: 24
})
