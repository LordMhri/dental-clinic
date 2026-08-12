import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { treatmentsCatalog } from '../data/mock'
import { useClinic } from '../context/ClinicContext'
import { Modal, ModalHeader } from './ui/Modal'

export function CreateInvoiceModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { patients, createInvoice, notify } = useClinic()
  const navigate = useNavigate()
  const [patientId, setPatientId] = useState(patients[0]?.id ?? '')
  const [treatment, setTreatment] = useState(treatmentsCatalog[0])
  const [total, setTotal] = useState('1500')
  const [notes, setNotes] = useState('')

  function submit() {
    if (!patientId) {
      notify('Pick a patient first.')
      return
    }
    const amount = Number(total)
    if (!amount || amount <= 0) {
      notify('Enter an amount in ETB.')
      return
    }
    const inv = createInvoice({ patientId, treatment, total: amount })
    onClose()
    notify(`${inv.id} created${notes ? ' with notes' : ''}.`)
    navigate(`/billing/pay/${inv.id}`)
  }

  return (
    <Modal open={open} onClose={onClose}>
      <ModalHeader title="Create Invoice" subtitle="New charge in Ethiopian Birr (ETB)" onClose={onClose} />
      <div className="space-y-3 px-6 py-5">
        <label className="block text-sm">
          <span className="mb-1.5 block font-semibold text-slate-700">Patient</span>
          <select
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2"
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.id}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-semibold text-slate-700">Treatment</span>
          <select
            value={treatment}
            onChange={(e) => setTreatment(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2"
          >
            {treatmentsCatalog.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-semibold text-slate-700">Amount (ETB)</span>
          <input
            value={total}
            onChange={(e) => setTotal(e.target.value)}
            inputMode="decimal"
            className="w-full rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-semibold text-slate-700">Notes (optional)</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Telebirr ref or cashier note..."
            className="w-full rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
      </div>
      <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
        <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm">
          Cancel
        </button>
        <button type="button" onClick={submit} className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white">
          Create invoice
        </button>
      </div>
    </Modal>
  )
}
