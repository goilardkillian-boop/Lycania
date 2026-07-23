interface Props {
  progress?: number
  label: string
}

export function ProgressBar({ progress, label }: Props): JSX.Element {
  const indeterminate = progress === undefined
  return (
    <div className="w-full">
      <div className="mb-1.5 flex items-center justify-between text-xs text-lycania-muted">
        <span>{label}</span>
        {!indeterminate && <span>{Math.round(progress * 100)}%</span>}
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-lycania-panel ring-1 ring-lycania-border">
        <div
          className={
            indeterminate
              ? 'h-full w-1/3 animate-pulse rounded-full bg-gradient-to-r from-lycania-bloodDark via-lycania-blood to-lycania-moon'
              : 'h-full rounded-full bg-gradient-to-r from-lycania-bloodDark via-lycania-blood to-lycania-moon transition-all duration-300'
          }
          style={indeterminate ? undefined : { width: `${Math.max(4, progress * 100)}%` }}
        />
      </div>
    </div>
  )
}
