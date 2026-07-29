import matin from './assets/backgrounds/matin.jpg'
import midi from './assets/backgrounds/midi.jpg'
import apresMidi from './assets/backgrounds/apres-midi.jpg'
import soir from './assets/backgrounds/soir.jpg'
import nuit from './assets/backgrounds/nuit.jpg'
import minuit from './assets/backgrounds/minuit.jpg'

/** Bornes horaires (heure locale, exclusive) : la première dont `before` dépasse l'heure actuelle gagne. */
const SCHEDULE: { before: number; src: string }[] = [
  { before: 5, src: minuit },
  { before: 10, src: matin },
  { before: 14, src: midi },
  { before: 18, src: apresMidi },
  { before: 21, src: soir },
  { before: 24, src: nuit }
]

export function backgroundForHour(hour: number): string {
  return SCHEDULE.find((slot) => hour < slot.before)?.src ?? minuit
}
