import { useClinic } from '../../context/ClinicContext'

export function ToastHost() {
  const { toast } = useClinic()
  if (!toast) return null
  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[60] max-w-sm rounded-xl bg-slate-800 px-4 py-3 text-sm font-medium text-white shadow-lg">
      {toast}
    </div>
  )
}
