interface Segment {
  label: string
  value: number
  color: string
}

export function DonutChart({
  total,
  segments,
}: {
  total: number
  segments: Segment[]
}) {
  const r = 54
  const c = 2 * Math.PI * r
  let offset = 0
  const sum = segments.reduce((a, s) => a + s.value, 0)

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative h-44 w-44">
        <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
          <circle cx="70" cy="70" r={r} fill="none" stroke="#EEF2FF" strokeWidth="16" />
          {segments.map((s) => {
            const len = (s.value / sum) * c
            const circle = (
              <circle
                key={s.label}
                cx="70"
                cy="70"
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth="16"
                strokeDasharray={`${len} ${c - len}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            )
            offset += len
            return circle
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-slate-800">{total}</span>
          <span className="text-xs text-slate-400">Today</span>
        </div>
      </div>
      <ul className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
            <span className="text-slate-600">{s.label}</span>
            <span className="ml-auto font-semibold text-slate-800">{s.value}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
