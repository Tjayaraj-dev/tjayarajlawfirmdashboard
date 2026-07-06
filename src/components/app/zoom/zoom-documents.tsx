'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Download, Trash2, FileText } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/format-date'
import { getDocumentUrl, softDeleteDocument } from '@/lib/documents/actions'
import {
  GlobalUploadDialog,
  type MatterOption,
  type CategoryOption,
} from '@/components/app/documents/global-upload-dialog'

export type AppellateDoc = {
  id: string
  filename: string
  file_size: number | null
  created_at: string
  category: { name: string } | null
  matter: { id: string; file_ref: string; title: string } | null
}

export function ZoomDocuments({
  documents,
  matters,
  categories,
}: {
  documents: AppellateDoc[]
  matters: MatterOption[]
  categories: CategoryOption[]
}) {
  const router = useRouter()
  const [uploadOpen, setUploadOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<string | null>(null)

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

  const remove = (id: string, filename: string, matterId: string) => {
    if (!confirm(`Remove “${filename}”? It is archived, not destroyed.`)) return
    setBusyId(id)
    startTransition(async () => {
      const { error } = await softDeleteDocument(id, matterId)
      setBusyId(null)
      if (error) {
        toast.error(error)
        return
      }
      toast.success('Document removed')
      router.refresh()
    })
  }

  return (
    <div className="mt-12">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-light text-brand-navy">
            Appellate documents (A–H)
          </h2>
          <p className="text-sm text-muted-foreground">
            Notice / petition of appeal, correspondence, particulars and the rest
            of the Court of Appeal file.
          </p>
        </div>
        <Button onClick={() => setUploadOpen(true)} disabled={matters.length === 0}>
          <Plus className="size-4" /> Add document
        </Button>
      </div>

      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Matter</TableHead>
              <TableHead>Added</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.length ? (
              documents.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="size-4 shrink-0 text-muted-foreground" />
                      <span className="font-medium text-brand-navy">{d.filename}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {d.category ? (
                      <Badge variant="outline" className="border-brand-gold/30 text-[10px] text-brand-gold">
                        {d.category.name}
                      </Badge>
                    ) : '—'}
                  </TableCell>
                  <TableCell>
                    {d.matter ? (
                      <Link href={`/matters/${d.matter.id}`} className="font-mono text-xs text-brand-gold hover:underline">
                        {d.matter.file_ref}
                      </Link>
                    ) : '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(d.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="size-8 p-0" onClick={() => download(d.id)} disabled={busyId === d.id}>
                      <Download className="size-4" />
                    </Button>
                    {d.matter && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="size-8 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => remove(d.id, d.filename, d.matter!.id)}
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
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No appellate documents yet. Click “Add document” to upload a scanned A–H file.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <GlobalUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        matters={matters}
        categories={categories}
      />
    </div>
  )
}
