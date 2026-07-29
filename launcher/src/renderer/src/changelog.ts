export interface ChangelogEntry {
  version: string
  date: string
  changes: string[]
}

/** La plus récente en premier. Pense à ajouter une entrée à chaque mise à jour notable. */
export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '0.1.11',
    date: '29 juillet 2026',
    changes: [
      "Les mises à jour du launcher sont maintenant obligatoires : impossible de jouer sur une version obsolète.",
      "L'aperçu TikTok affiche maintenant de vraies vidéos directement dans le launcher."
    ]
  },
  {
    version: '0.1.10',
    date: '29 juillet 2026',
    changes: [
      "Nouveau : ce panneau de nouveautés, directement sur l'accueil.",
      'Nouveau : un aperçu du contenu TikTok du serveur, avec un accès direct.',
      'Nouveaux mods : Dusty Decorations, Paintings ++, Transparent (avec Ash API) et Hidden Names.'
    ]
  },
  {
    version: '0.1.9',
    date: '28 juillet 2026',
    changes: [
      'DecoCraft et Aquaculture Delight sont de retour dans le pack.',
      "Corrigé : le jeu pouvait crasher au lancement à cause d'une incompatibilité Easy NPC.",
      "Corrigé : la connexion Microsoft pouvait échouer en changeant de compte lors d'une nouvelle tentative.",
      "Corrigé : un échec de lancement après une installation réussie pouvait passer inaperçu, sans aucun message."
    ]
  },
  {
    version: '0.1.5 – 0.1.8',
    date: '27-28 juillet 2026',
    changes: [
      'La bande-annonce du serveur est maintenant intégrée au launcher.',
      'Nouvelle barre de gestion de la mémoire (RAM), plus simple à régler.',
      "Corrigé : l'installation de Java pouvait rester bloquée sans jamais afficher d'erreur.",
      'Ajout de shaderpacks au modpack, avec leurs réglages par défaut.'
    ]
  },
  {
    version: '0.1.0 – 0.1.4',
    date: '26-27 juillet 2026',
    changes: [
      'Première version publique du launcher Lycania.',
      'Connexion avec ton compte Microsoft, installation automatique du jeu, de Java et des mods.',
      'Mise à jour automatique du modpack et du launcher lui-même.',
      "Corrigé : la connexion ne restait pas toujours active au redémarrage.",
      "Corrigé : l'aperçu du skin pouvait rester vide."
    ]
  }
]
