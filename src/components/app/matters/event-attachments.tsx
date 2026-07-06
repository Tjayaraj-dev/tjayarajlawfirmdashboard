'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Paperclip, Download, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  uploadEventDocument,
  getDocumentUrl,
  softDeleteDocument,
} from '@/lib/documents/actions'

export type Attachment = {
  id: string
  filename: string
  file_size: number | null
}

function fmtSize(b: number | null) {
  if (!b) return ''
  if (b < 1024) return `${b} B`
  if (b < 1048576) return `${(b / 1024).toFixed(0)} KB`
  return `${(b / 1048576).toFixed(1)} MB`
}

export function EventAttachments({
  matterId,
  eventId,
  attachments,
}: {
  matterId: string
  eventId: string
  attachments: Attachment[]
}) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [pending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<string | null>(null)

  const upload = () => {
    const file = fileRef.current?.files?.[0]
    if (!file) {
      toast.error('Choose a file first')
      return
    }
    const fd = new FormData()
    fd.set('file', file)
    startTransition(async () => {
      const { error } = await uploadEventDocument(matterId, eventId, fd)
      if (error) {
        toast.error(error)
        return
      }
      toast.success('File attached')
      if (fileRef.current) fileRef.current.value = ''
      router.refresh()
    })
  }

  const download = (id: string) => {
    setBusyId(id)
    startTransition(async () => {
      const { url, error } = await getDocumentUrl(id)
      setBusyId(null)
      if (error || !url) {
        toast.error(error ?? 'Could not generate link')
        return
      }
      window.open(url, '_blank', 'noopener')
    })
  }

  const remove = (id: string) => {
    if (!confirm('Remove this attachment? It is archived, not destroyed.')) return
    setBusyId(id)
    startTransition(async () => {
      const { error } = await softDeleteDocument(id, matterId)
      setBusyId(null)
      if (error) {
        toast.error(error)
        return
      }
      toast.success('Attachment removed')
      router.refresh()
    })
  }

  return (
    <div className="space-y-2">
      <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        <Paperclip className="size-3" /> Attachments
      </p>

      {attachments.length > 0 && (
        <ul className="space-y-1">
          {attachments.map((a) => (
            <li key={a.id} className="flex items-center gap-2 rounded border bg-white px-2 py-1 text-xs">
              <span className="min-w-0 flex-1 truncate text-brand-navy">{a.filename}</span>
              {a.file_size ? <span className="text-muted-foreground">{fmtSize(a.file_size)}</span> : null}
              <button
                onClick={() => download(a.id)}
                disabled={busyId === a.id}
                className="text-muted-foreground hover:text-brand-navy"
                aria-label="Download"
              >
                <Download className="size-3.5" />
              </button>
              <button
                onClick={() => remove(a.id)}
                disabled={busyId === a.id}
                className="text-muted-foreground hover:text-destructive"
                aria-label="Remove"
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          className="max-w-[12rem] flex-1 text-xs file:mr-2 file:rounded file:border-0 file:bg-brand-navy/90 file:px-2 file:py-1 file:text-[11px] file:text-white"
        />
        <Button size="sm" variant="outline" onClick={upload} disabled={pending}>
          {pending ? 'Attaching…' : 'Attach'}
        </Button>
      </div>
    </div>
  )
}
