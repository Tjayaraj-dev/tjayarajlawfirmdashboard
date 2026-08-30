'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Upload, Download, Archive, Trash2, FileText, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  getDocumentUrl,
  softDeleteDocument,
  hardDeleteDocument,
} from '@/lib/documents/actions'
import { uploadDocument } from '@/lib/documents/upload'
import type { Database } from '@/lib/supabase/database.types'

type DocumentRow = Database['public']['Tables']['documents']['Row'] & {
  category: { name: string } | null
}
type Category = { id: string; name: string }

function fmtSize(bytes: number | null) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
import { formatDate as fmtDate } from '@/lib/format-date'

export function DocumentsPanel({
  matterId,
  documents,
  categories,
  isAdmin,
}: {
  matterId: string
  documents: DocumentRow[]
  categories: Category[]
  isAdmin: boolean
}) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [categoryId, setCategoryId] = useState<string>('')
  const [pending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<string | null>(null)

  const onUpload = () => {
    const file = fileRef.current?.files?.[0]
    if (!file) {
      toast.error('Choose a file first')
      return
    }
    startTransition(async () => {
      const { error } = await uploadDocument({ matterId, file, categoryId })
      if (error) {
        toast.error(error)
        return
      }
      toast.success('Document uploaded')
      if (fileRef.current) fileRef.current.value = ''
      setCategoryId('')
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

  const archive = (id: string) => {
    if (!confirm('Archive this document? Prior versions are always retained.')) return
    setBusyId(id)
    startTransition(async () => {
      const { error } = await softDeleteDocument(id, matterId)
      setBusyId(null)
      if (error) {
        toast.error(error)
        return
      }
      toast.success('Document archived')
      router.refresh()
    })
  }

  const destroy = (id: string, filename: string) => {
    if (!confirm(`Permanently delete “${filename}” and its file? This cannot be undone.`)) return
    setBusyId(id)
    startTransition(async () => {
      const { error } = await hardDeleteDocument(id, matterId)
      setBusyId(null)
      if (error) {
        toast.error(error)
        return
      }
      toast.success('Document permanently deleted')
      router.refresh()
    })
  }

  return (
    <div>
      <h2 className="mb-4 font-display text-xl font-light text-brand-navy">
        Documents
      </h2>

      <div className="mb-5 flex flex-wrap items-center gap-2 rounded-lg border bg-muted/20 p-3">
        <input
          ref={fileRef}
          type="file"
          className="max-w-xs flex-1 cursor-pointer rounded-lg border border-input bg-white p-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted/30 file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-brand-navy file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white"
        />
        <Select
          value={categoryId || null}
          onValueChange={(v) => setCategoryId(v ?? '')}
          items={categories.map((c) => ({ value: c.id, label: c.name }))}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Category (optional)" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={onUpload} disabled={pending} size="sm">
          <Upload className="size-4" /> Upload
        </Button>
      </div>

      {documents.length === 0 ? (
        <p className="rounded-lg border border-dashed bg-muted/20 p-8 text-center text-sm text-muted-foreground">
          No documents yet. Pleadings, affidavits, KYC and evidence live here —
          signed-URL access only, every version retained.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border bg-white">
          {documents.map((doc) => (
            <li key={doc.id} className="flex items-center gap-3 px-4 py-3">
              <FileText className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-brand-navy">
                    {doc.filename}
                  </span>
                  {doc.version > 1 && (
                    <Badge variant="outline" className="text-[10px]">v{doc.version}</Badge>
                  )}
                  {doc.category && (
                    <Badge variant="outline" className="border-brand-gold/30 text-[10px] text-brand-gold">
                      {doc.category.name}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {fmtDate(doc.created_at)}
                  {doc.file_size ? ` · ${fmtSize(doc.file_size)}` : ''}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="size-8 p-0"
                onClick={() => download(doc.id)}
                disabled={busyId === doc.id}
              >
                <Download className="size-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={<Button variant="ghost" size="sm" className="size-8 p-0 text-muted-foreground" disabled={busyId === doc.id} />}
                >
                  <MoreHorizontal className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => archive(doc.id)} className="text-destructive">
                    <Archive className="size-3.5" /> Archive
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => destroy(doc.id, doc.filename)} className="text-destructive">
                        <Trash2 className="size-3.5" /> Delete permanently
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
