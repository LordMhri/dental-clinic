import { useEffect, useRef, useState, type ReactNode } from 'react'
import { MoreVertical } from 'lucide-react'

export interface MenuItem {
  label: string
  onClick: () => void
  danger?: boolean
}

export function ActionMenu({ items, icon }: { items: MenuItem[]; icon?: ReactNode }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        aria-label="Open actions"
      >
        {icon ?? <MoreVertical className="h-4 w-4" />}
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-1 min-w-[180px] rounded-xl border border-slate-100 bg-white py-1 shadow-lg">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                item.onClick()
                setOpen(false)
              }}
              className={`block w-full px-3 py-2 text-left text-sm hover:bg-slate-50 ${item.danger ? 'text-rose-600' : 'text-slate-700'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
