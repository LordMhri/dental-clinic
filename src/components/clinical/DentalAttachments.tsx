import { useState, useRef, type ChangeEvent } from 'react'
import { UploadCloud, FileText, Trash2, Eye, X, Image as ImageIcon } from 'lucide-react'

export interface AttachmentItem {
  id: string
  fileName: string
  fileType: string
  url: string | null
  sizeBytes: number
  notes?: string | null
  uploadedAt: string
}

interface DentalAttachmentsProps {
  patientId: string
  attachments: AttachmentItem[]
  onUploadSuccess: (newAttachment: AttachmentItem) => void
  onDeleteSuccess: (attachmentId: string) => void
  token: string | null
  readOnly?: boolean
}

export function DentalAttachments({
  patientId,
  attachments,
  onUploadSuccess,
  onDeleteSuccess,
  token,
  readOnly = false,
}: DentalAttachmentsProps) {
  const [uploading, setUploading] = useState(false)
  const [notes, setNotes] = useState('')
  const [fileType, setFileType] = useState('xray')
  const [previewItem, setPreviewItem] = useState<AttachmentItem | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('fileType', fileType)
      if (notes.trim()) formData.append('notes', notes.trim())

      const res = await fetch(`/api/patients/${patientId}/attachments`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      })

      if (!res.ok) {
        throw new Error('Upload failed')
      }

      const data = await res.json()
      onUploadSuccess(data.attachment)
      setNotes('')
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch {
      alert('Failed to upload file to dental storage.')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(attachmentId: string) {
    if (!confirm('Are you sure you want to delete this scan?')) return

    try {
      const res = await fetch(`/api/patients/${patientId}/attachments/${attachmentId}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
      if (res.ok) {
        onDeleteSuccess(attachmentId)
      }
    } catch {
      alert('Failed to delete attachment.')
    }
  }

  function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-800">Dental Scans & Radiographs</h2>
          <p className="text-xs text-slate-500">
            Periapical, bitewing, panoramic X-rays, and intraoral camera photos.
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
          {attachments.length} {attachments.length === 1 ? 'file' : 'files'}
        </span>
      </div>

      {/* Upload Box */}
      {!readOnly && (
        <div className="mb-5 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={fileType}
              onChange={(e) => setFileType(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700"
            >
              <option value="xray">Radiograph (X-Ray)</option>
              <option value="intraoral_photo">Intraoral Photo</option>
              <option value="panoramic">Panoramic Scan (OPG)</option>
              <option value="consent_pdf">Consent Form (PDF)</option>
            </select>

            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Clinical note (e.g. Tooth #14 post-obturation)"
              className="min-w-[200px] flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-[#2563EB]"
            />

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelected}
              accept="image/*,application/pdf"
              className="hidden"
            />

            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#2563EB] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#1D4ED8] disabled:opacity-50"
            >
              <UploadCloud className="h-4 w-4" />
              {uploading ? 'Streaming to MinIO...' : 'Upload Scan'}
            </button>
          </div>
        </div>
      )}

      {/* Scans Gallery Grid */}
      {attachments.length === 0 ? (
        <div className="flex min-h-[140px] items-center justify-center rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
          No radiographs or scans attached yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {attachments.map((item) => {
            const isPdf = item.fileName.endsWith('.pdf')
            return (
              <div
                key={item.id}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md"
              >
                {/* Thumbnail / Preview */}
                <div
                  className="relative flex h-28 w-full cursor-pointer items-center justify-center bg-slate-900 overflow-hidden"
                  onClick={() => setPreviewItem(item)}
                >
                  {isPdf ? (
                    <FileText className="h-10 w-10 text-slate-400" />
                  ) : item.url ? (
                    <img
                      src={item.url}
                      alt={item.fileName}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-slate-500" />
                  )}

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-slate-800 shadow">
                      <Eye className="h-3 w-3" /> View
                    </span>
                  </div>
                </div>

                {/* Metadata */}
                <div className="p-2">
                  <div className="truncate text-xs font-semibold text-slate-800" title={item.fileName}>
                    {item.fileName}
                  </div>
                  {item.notes && (
                    <div className="truncate text-[11px] text-slate-500" title={item.notes}>
                      {item.notes}
                    </div>
                  )}
                  <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                    <span>{formatBytes(item.sizeBytes)}</span>
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(item.id)
                        }}
                        className="text-slate-400 hover:text-rose-600"
                        title="Delete scan"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Full-Screen X-Ray Lightbox Modal */}
      {previewItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setPreviewItem(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-2xl bg-slate-900 p-2 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewItem(null)}
              className="absolute right-4 top-4 z-10 rounded-full bg-black/60 p-1.5 text-white hover:bg-black"
            >
              <X className="h-5 w-5" />
            </button>

            {previewItem.fileName.endsWith('.pdf') ? (
              <iframe
                src={previewItem.url || ''}
                className="h-[75vh] w-[80vw] rounded-xl bg-white"
                title={previewItem.fileName}
              />
            ) : (
              <div className="flex flex-col items-center">
                <img
                  src={previewItem.url || ''}
                  alt={previewItem.fileName}
                  className="max-h-[80vh] rounded-xl object-contain shadow-lg"
                />
                <div className="mt-2 text-center text-xs text-slate-300">
                  <span className="font-semibold">{previewItem.fileName}</span>
                  {previewItem.notes && <span className="ml-2 italic">— {previewItem.notes}</span>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
