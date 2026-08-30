'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Upload, Download, Trash2, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/format-date'
import { getDocumentUrl, softDeleteDocument } from '@/lib/documents/actions'
import { uploadDocument } from '@/lib/documents/upload'

export type DefenceDoc = {
  id: string
  filename: string
  file_size: number | null
  created_at: string
}
type Category = { id: string; name: string }

function IndexTab({
  matterId,
  category,
  docs,
  index,
}: {
  matterId: string
  category: Category
  docs: DefenceDoc[]
  index: number
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
    startTransition(async () => {
      const { error } = await uploadDocument({ matterId, file, categoryId: category.id })
      if (error) {
        toast.error(error)
        return
      }
      toast.success(`Filed under ${category.name}`)
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

  const remove = (id: string, filename: string) => {
    if (!confirm(`Remove “${filename}”?`)) return
    setBusyId(id)
    startTransition(async () => {
      const { error } = await softDeleteDocument(id, matterId)
      setBusyId(null)
      if (error) {
        toast.error(error)
        return
      }
      toast.success('Removed')
      router.refresh()
    })
  }

  return (
    <div className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-xs text-muted-foreground">{index}.</span>
          <span className="font-medium text-brand-navy">{category.name}</span>
          {docs.length > 0 && (
            <span className="text-xs text-muted-foreground">· {docs.length} file{docs.length > 1 ? 's' : ''}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            className="max-w-[11rem] text-xs file:mr-2 file:rounded file:border-0 file:bg-brand-navy/90 file:px-2 file:py-1 file:text-[11px] file:text-white"
          />
          <Button size="sm" variant="outline" onClick={upload} disabled={pending}>
            <Upload className="size-3.5" /> Add
          </Button>
        </div>
      </div>

      {docs.length > 0 && (
        <ul className="mt-2 space-y-1 pl-6">
          {docs.map((d) => (
            <li key={d.id} className="flex items-center gap-2 text-xs">
              <FileText className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate text-brand-navy">{d.filename}</span>
              <span className="text-muted-foreground">{formatDate(d.created_at)}</span>
              <button onClick={() => download(d.id)} disabled={busyId === d.id} className="text-muted-foreground hover:text-brand-navy">
                <Download className="size-3.5" />
              </button>
              <button onClick={() => remove(d.id, d.filename)} disabled={busyId === d.id} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function DefenceDocuments({
  matterId,
  categories,
  docsByCategory,
}: {
  matterId: string
  categories: Category[]
  docsByCategory: Record<string, DefenceDoc[]>
}) {
  return (
    <section>
      <h2 className="mb-1 font-display text-xl font-light text-brand-navy">Case file index (51B)</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        The defence file tabs — scan and file each document under its tab.
      </p>
      <div className="divide-y rounded-lg border bg-white">
        {categories.map((c, i) => (
          <IndexTab key={c.id} matterId={matterId} category={c} docs={docsByCategory[c.id] ?? []} index={i + 1} />
        ))}
      </div>
    </section>
  )
}
