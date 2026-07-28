const MIN_MB = 1024

interface Props {
  valueMb: number
  totalMemoryMb?: number
  onChange: (mb: number) => void
  onCommit: (mb: number) => void
}

function formatGb(mb: number): string {
  const gb = mb / 1024
  return Number.isInteger(gb) ? `${gb}` : gb.toFixed(1)
}

export function RamSlider({ valueMb, totalMemoryMb, onChange, onCommit }: Props): JSX.Element {
  const maxMb = Math.max(totalMemoryMb ?? 16384, valueMb, MIN_MB * 2)
  const percent = Math.min(100, Math.max(0, ((valueMb - MIN_MB) / (maxMb - MIN_MB)) * 100))

  function commit(e: React.SyntheticEvent<HTMLInputElement>): void {
    onCommit(Number(e.currentTarget.value))
  }

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <label htmlFor="ram-slider" className="text-sm text-lycania-muted">
          Mémoire allouée au jeu
        </label>
        <span className="font-display text-lg text-lycania-bone">{formatGb(valueMb)} Go</span>
      </div>
      <input
        id="ram-slider"
        type="range"
        min={MIN_MB}
        max={maxMb}
        step={256}
        value={valueMb}
        onChange={(e) => onChange(Number(e.target.value))}
        onMouseUp={commit}
        onTouchEnd={commit}
        onKeyUp={commit}
        className="ram-slider"
        style={{ ['--fill' as string]: `${percent}%` }}
      />
      <div className="mt-1 flex justify-between text-xs text-lycania-muted">
        <span>{formatGb(MIN_MB)} Go</span>
        <span>
          {totalMemoryMb ? `${(totalMemoryMb / 1024).toFixed(0)} Go disponibles sur cette machine` : `${formatGb(maxMb)} Go`}
        </span>
      </div>
    </div>
  )
}
