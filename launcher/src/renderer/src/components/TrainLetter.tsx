interface Props {
  letter: string
  char: string
  onHit: (letter: string) => void
}

/**
 * Une lettre ordinaire dans un paragraphe, mais cliquable : sert à disséminer un easter egg
 * dans le texte sans que rien ne le trahisse visuellement.
 */
export function TrainLetter({ letter, char, onHit }: Props): JSX.Element {
  return (
    <span onClick={() => onHit(letter)} className="cursor-pointer">
      {char}
    </span>
  )
}
