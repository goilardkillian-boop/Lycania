import { useMemo } from 'react'

/**
 * Décor animé partagé par tous les écrans (lune, étoiles, brume, silhouette de village).
 * En attendant une vraie image de fond fournie par l'utilisateur, ce rendu CSS/SVG comble
 * le vide derrière les écrans de connexion et de jeu.
 */
export function BackgroundScene(): JSX.Element {
  const stars = useMemo(
    () =>
      Array.from({ length: 70 }, (_, i) => ({
        id: i,
        top: Math.random() * 65,
        left: Math.random() * 100,
        size: Math.random() * 1.6 + 0.6,
        delay: Math.random() * 6,
        duration: 3 + Math.random() * 3
      })),
    []
  )

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-blood-moon">
      <div className="absolute left-1/2 top-8 h-44 w-44 -translate-x-1/2 rounded-full bg-lycania-moon/90 shadow-[0_0_140px_45px_rgba(232,70,91,0.3)]" />

      {stars.map((s) => (
        <span
          key={s.id}
          className="absolute rounded-full bg-lycania-bone/80"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            animation: `lycania-twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`
          }}
        />
      ))}

      <svg
        className="absolute bottom-0 left-0 w-full text-lycania-void"
        viewBox="0 0 1200 200"
        preserveAspectRatio="none"
        fill="currentColor"
      >
        <path d="M0,200 L0,120 L40,120 L40,90 L70,90 L70,110 L110,110 L110,60 L130,60 L130,20 L150,20 L150,70 L190,70 L190,100 L230,100 L230,50 L250,50 L250,10 L270,10 L270,50 L300,50 L300,90 L340,90 L340,110 L380,110 L380,70 L410,70 L410,40 L430,40 L430,80 L470,80 L470,110 L520,110 L520,60 L540,60 L540,20 L560,20 L560,60 L600,60 L600,100 L650,100 L650,120 L700,120 L700,80 L720,80 L720,30 L740,30 L740,80 L780,80 L780,110 L830,110 L830,70 L860,70 L860,110 L900,110 L900,90 L950,90 L950,120 L1000,120 L1000,60 L1030,60 L1030,20 L1050,20 L1050,60 L1090,60 L1090,110 L1130,110 L1130,90 L1170,90 L1170,130 L1200,130 L1200,200 Z" />
      </svg>

      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-lycania-void to-transparent" />

      <div className="lycania-mist lycania-mist-1" />
      <div className="lycania-mist lycania-mist-2" />
    </div>
  )
}
