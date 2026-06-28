'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Search, Download, Trash2, FileText, Upload } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getDocumentUrl, hardDeleteDocument } from '@/lib/documents/actions'
import {
  GlobalUploadDialog,
  type MatterOption,
  type CategoryOption,
} from './global-upload-dialog'

export type AllDocRow = {
  id: string
  filename: string
  version: number
  file_size: number | null
  created_at: string
  category: { name: string } | null
  matter: { id: string; file_ref: string; title: string } | null
}

function fmtSize(b: number | null) {
  if (!b) return ''
  if (b < 1024) return `${b} B`
  if (b < 1048576) return `${(b / 1024).toFixed(0)} KB`
  return `${(b / 1048576).toFixed(1)} MB`
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function AllDocuments({
  docs,
  isAdmin,
  matters,
  categories,
}: {
  docs: AllDocRow[]
  isAdmin: boolean
  matters: MatterOption[]
  categories: CategoryOption[]
}) {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [pending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [uploadOpen, setUploadOpen] = useState(false)

  const filtered = useMemo(() => {
    const needle = q.toLowerCase()
    if (!needle) return docs
    return docs.filter((d) =>
      [d.filename, d.matter?.file_ref, d.matter?.title, d.category?.name]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(needle)
    )
  }, [docs, q])

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

  const destroy = (id: string, filename: string, matterId: string) => {
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
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search documents…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={() => setUploadOpen(true)} disabled={matters.length === 0}>
          <Upload className="size-4" /> Upload
        </Button>
      </div>

      <GlobalUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        matters={matters}
        categories={categories}
      />

      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document</TableHead>
              <TableHead>Matter</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Added</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length ? (
              filtered.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="size-4 shrink-0 text-muted-foreground" />
                      <span className="font-medium text-brand-navy">{d.filename}</span>
                      {d.version > 1 && <Badge variant="outline" className="text-[10px]">v{d.version}</Badge>}
                    </div>
                    {d.file_size ? (
                      <span className="text-xs text-muted-foreground">{fmtSize(d.file_size)}</span>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    {d.matter ? (
                      <Link href={`/matters/${d.matter.id}`} className="font-mono text-xs text-brand-gold hover:underline">
                        {d.matter.file_ref}
                      </Link>
                    ) : '—'}
                  </TableCell>
                  <TableCell>
                    {d.category ? (
                      <Badge variant="outline" className="text-[10px]">{d.category.name}</Badge>
                    ) : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{fmtDate(d.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="size-8 p-0" onClick={() => download(d.id)} disabled={busyId === d.id}>
                      <Download className="size-4" />
                    </Button>
                    {isAdmin && d.matter && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="size-8 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => destroy(d.id, d.filename, d.matter!.id)}
                        disabled={busyId === d.id}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-28 text-center text-muted-foreground">
                  No documents yet. Upload from within a matter.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
