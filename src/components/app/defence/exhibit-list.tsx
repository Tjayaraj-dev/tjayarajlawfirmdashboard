'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/format-date'
import { EXHIBIT_MARKINGS } from '@/lib/defence/config'
import { createExhibit, updateExhibit, deleteExhibit } from '@/lib/defence/actions'

export type ExhibitRow = {
  id: string
  marking: string | null
  date_presented: string | null
  through_witness: string | null
  description: string | null
}

const empty = { marking: '', date_presented: '', through_witness: '', description: '' }

export function ExhibitList({ matterId, exhibits }: { matterId: string; exhibits: ExhibitRow[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [v, setV] = useState(empty)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (!open) {
      setEditId(null)
      setV(empty)
    }
  }, [open])

  const openEdit = (x: ExhibitRow) => {
    setEditId(x.id)
    setV({
      marking: x.marking ?? '',
      date_presented: x.date_presented ?? '',
      through_witness: x.through_witness ?? '',
      description: x.description ?? '',
    })
    setOpen(true)
  }

  const submit = () => {
    startTransition(async () => {
      const res = editId ? await updateExhibit(editId, matterId, v) : await createExhibit(matterId, v)
      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success(editId ? 'Exhibit updated' : 'Exhibit added')
      setOpen(false)
      router.refresh()
    })
  }

  const remove = (id: string) => {
    if (!confirm('Remove this exhibit?')) return
    startTransition(async () => {
      const res = await deleteExhibit(id, matterId)
      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success('Exhibit removed')
      router.refresh()
    })
  }

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-xl font-light text-brand-navy">Exhibit list (Senarai Ekshibit)</h2>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="size-4" /> Add exhibit
        </Button>
      </div>

      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">No.</TableHead>
              <TableHead>Marking</TableHead>
              <TableHead>Date presented</TableHead>
              <TableHead>Through witness</TableHead>
              <TableHead>Description</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {exhibits.length ? (
              exhibits.map((x, i) => (
                <TableRow key={x.id}>
                  <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                  <TableCell>
                    {x.marking ? <Badge variant="outline" className="text-[10px]">{x.marking}</Badge> : '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(x.date_presented)}</TableCell>
                  <TableCell>{x.through_witness ?? '—'}</TableCell>
                  <TableCell className="max-w-xs truncate">{x.description ?? '—'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="size-8 p-0" onClick={() => openEdit(x)}>
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="size-8 p-0 text-muted-foreground hover:text-destructive" onClick={() => remove(x.id)}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-20 text-center text-muted-foreground">
                  No exhibits yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-light text-brand-navy">
              {editId ? 'Edit exhibit' : 'Add exhibit'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="x_marking">Marking</Label>
                <Select value={v.marking || null} onValueChange={(val) => setV({ ...v, marking: val ?? '' })}>
                  <SelectTrigger id="x_marking">
                    <SelectValue placeholder="P / ID / D" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXHIBIT_MARKINGS.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="x_date">Date presented</Label>
                <Input id="x_date" type="date" value={v.date_presented} onChange={(e) => setV({ ...v, date_presented: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="x_witness">Through witness</Label>
              <Input id="x_witness" value={v.through_witness} onChange={(e) => setV({ ...v, through_witness: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="x_desc">Description</Label>
              <Textarea id="x_desc" rows={2} value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>Cancel</Button>
            <Button onClick={submit} disabled={pending}>{pending ? 'Saving…' : editId ? 'Save' : 'Add'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
