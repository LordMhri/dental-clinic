const palette = [
  'bg-blue-100 text-blue-700',
  'bg-teal-100 text-teal-700',
  'bg-violet-100 text-violet-700',
  'bg-amber-100 text-amber-800',
  'bg-rose-100 text-rose-700',
  'bg-sky-100 text-sky-700',
]

export function Avatar({
  initials,
  size = 'md',
}: {
  initials: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const idx = initials.charCodeAt(0) % palette.length
  const dim = size === 'sm' ? 'h-8 w-8 text-xs' : size === 'lg' ? 'h-14 w-14 text-lg' : 'h-10 w-10 text-sm'
  return (
    <div
      className={`${dim} ${palette[idx]} flex shrink-0 items-center justify-center rounded-full font-semibold`}
    >
      {initials}
    </div>
  )
}
