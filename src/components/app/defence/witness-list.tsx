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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatDate } from '@/lib/format-date'
import { WITNESS_STATUSES } from '@/lib/defence/config'
import { createWitness, updateWitness, deleteWitness } from '@/lib/defence/actions'

export type WitnessRow = {
  id: string
  name: string
  role: string | null
  date_presented: string | null
  status: string | null
}

const empty = { name: '', role: '', date_presented: '', status: '' }

export function WitnessList({ matterId, witnesses }: { matterId: string; witnesses: WitnessRow[] }) {
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

  const openEdit = (w: WitnessRow) => {
    setEditId(w.id)
    setV({ name: w.name, role: w.role ?? '', date_presented: w.date_presented ?? '', status: w.status ?? '' })
    setOpen(true)
  }

  const submit = () => {
    startTransition(async () => {
      const res = editId ? await updateWitness(editId, matterId, v) : await createWitness(matterId, v)
      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success(editId ? 'Witness updated' : 'Witness added')
      setOpen(false)
      router.refresh()
    })
  }

  const remove = (id: string, name: string) => {
    if (!confirm(`Remove witness “${name}”?`)) return
    startTransition(async () => {
      const res = await deleteWitness(id, matterId)
      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success('Witness removed')
      router.refresh()
    })
  }

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-xl font-light text-brand-navy">Witness list (Senarai Saksi)</h2>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="size-4" /> Add witness
        </Button>
      </div>

      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">No.</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Role in case</TableHead>
              <TableHead>Date evidence given</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {witnesses.length ? (
              witnesses.map((w, i) => (
                <TableRow key={w.id}>
                  <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="font-medium text-brand-navy">{w.name}</TableCell>
                  <TableCell>{w.role ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(w.date_presented)}</TableCell>
                  <TableCell>{w.status ?? '—'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="size-8 p-0" onClick={() => openEdit(w)}>
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="size-8 p-0 text-muted-foreground hover:text-destructive" onClick={() => remove(w.id, w.name)}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-20 text-center text-muted-foreground">
                  No witnesses yet.
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
              {editId ? 'Edit witness' : 'Add witness'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="w_name">Name</Label>
              <Input id="w_name" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="w_role">Role in case</Label>
              <Input id="w_role" value={v.role} onChange={(e) => setV({ ...v, role: e.target.value })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="w_date">Date evidence given</Label>
                <Input id="w_date" type="date" value={v.date_presented} onChange={(e) => setV({ ...v, date_presented: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="w_status">Status</Label>
                <Select value={v.status || null} onValueChange={(val) => setV({ ...v, status: val ?? '' })}>
                  <SelectTrigger id="w_status">
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    {WITNESS_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
