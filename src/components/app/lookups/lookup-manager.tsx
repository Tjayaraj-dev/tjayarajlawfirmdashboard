'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createLookup, renameLookup, deleteLookup } from '@/lib/lookups/actions'

type LookupTable = 'case_types' | 'document_categories' | 'courts'
type Row = { id: string; name: string; slug: string }

export function LookupManager({
  table,
  rows,
}: {
  table: LookupTable
  rows: Row[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const add = () => {
    if (!newName.trim()) return
    startTransition(async () => {
      const { error } = await createLookup(table, newName)
      if (error) {
        toast.error(error)
        return
      }
      toast.success('Added')
      setNewName('')
      router.refresh()
    })
  }

  const saveEdit = (id: string) => {
    startTransition(async () => {
      const { error } = await renameLookup(table, id, editName)
      if (error) {
        toast.error(error)
        return
      }
      toast.success('Renamed')
      setEditingId(null)
      router.refresh()
    })
  }

  const remove = (id: string, name: string) => {
    if (!confirm(`Delete “${name}”?`)) return
    startTransition(async () => {
      const { error } = await deleteLookup(table, id)
      if (error) {
        toast.error(error)
        return
      }
      toast.success('Deleted')
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Add new…"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          className="max-w-xs"
        />
        <Button onClick={add} disabled={pending || !newName.trim()}>
          <Plus className="size-4" /> Add
        </Button>
      </div>

      <ul className="divide-y rounded-lg border bg-white">
        {rows.length === 0 && (
          <li className="px-4 py-8 text-center text-sm text-muted-foreground">
            None yet. Add the first above.
          </li>
        )}
        {rows.map((row) => (
          <li key={row.id} className="flex items-center gap-2 px-4 py-2.5">
            {editingId === row.id ? (
              <>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveEdit(row.id)}
                  className="max-w-xs"
                  autoFocus
                />
                <Button variant="ghost" size="sm" className="size-8 p-0" onClick={() => saveEdit(row.id)} disabled={pending}>
                  <Check className="size-4 text-emerald-600" />
                </Button>
                <Button variant="ghost" size="sm" className="size-8 p-0" onClick={() => setEditingId(null)}>
                  <X className="size-4" />
                </Button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm text-brand-navy">{row.name}</span>
                <span className="font-mono text-xs text-muted-foreground">{row.slug}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="size-8 p-0"
                  onClick={() => {
                    setEditingId(row.id)
                    setEditName(row.name)
                  }}
                >
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="size-8 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => remove(row.id, row.name)}
                  disabled={pending}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
