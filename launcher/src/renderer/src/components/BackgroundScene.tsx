import { useMemo } from 'react'
import { backgroundForHour } from '../backgroundImages'

/**
 * Décor partagé par tous les écrans : une vraie capture du village, choisie selon l'heure locale
 * à l'ouverture du launcher, avec un voile sombre dessus pour que le texte reste lisible quel
 * que soit le moment de la journée montré. La brume qui dérive vient en plus, par dessus.
 */
export function BackgroundScene(): JSX.Element {
  const src = useMemo(() => backgroundForHour(new Date().getHours()), [])

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-lycania-void">
      <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />

      {/* Voile sombre + teinte de la charte : garde le texte lisible et l'identité visuelle
          cohérente, que la photo soit un plein jour ensoleillé ou une nuit déjà très sombre. */}
      <div className="absolute inset-0 bg-gradient-to-b from-lycania-void/95 via-lycania-void/80 to-lycania-void/95" />
      <div className="absolute inset-0 bg-lycania-blood/20 mix-blend-multiply" />

      <div className="lycania-mist lycania-mist-1" />
      <div className="lycania-mist lycania-mist-2" />
    </div>
  )
}
