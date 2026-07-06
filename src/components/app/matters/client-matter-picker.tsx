'use client'

import { useMemo } from 'react'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// A matter carries its client so pickers can be client-first.
export type MatterOption = {
  id: string
  file_ref: string
  title: string
  client_id: string
  client_name: string
}

// Controlled cascade: pick the Client, then the Matter (case file). If the
// client has only one case it is auto-selected. Both values live in the parent.
export function ClientMatterPicker({
  matters,
  clientId,
  onClientChange,
  matterId,
  onMatterChange,
}: {
  matters: MatterOption[]
  clientId: string
  onClientChange: (id: string) => void
  matterId: string
  onMatterChange: (id: string) => void
}) {
  const clients = useMemo(() => {
    const map = new Map<string, string>()
    for (const m of matters) if (!map.has(m.client_id)) map.set(m.client_id, m.client_name)
    return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) =>
      a.name.localeCompare(b.name)
    )
  }, [matters])

  const clientMatters = useMemo(
    () => matters.filter((m) => m.client_id === clientId),
    [matters, clientId]
  )

  const pickClient = (cid: string) => {
    onClientChange(cid)
    const ms = matters.filter((m) => m.client_id === cid)
    onMatterChange(ms.length === 1 ? ms[0].id : '')
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor="cmp_client">Client</Label>
        <Select
          value={clientId || null}
          onValueChange={(v) => pickClient(v ?? '')}
          items={clients.map((c) => ({ value: c.id, label: c.name }))}
        >
          <SelectTrigger id="cmp_client">
            <SelectValue placeholder="Select a client" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="cmp_matter">Matter (case file)</Label>
        <Select
          value={matterId || null}
          onValueChange={(v) => onMatterChange(v ?? '')}
          disabled={!clientId}
          items={clientMatters.map((m) => ({ value: m.id, label: `${m.file_ref} — ${m.title}` }))}
        >
          <SelectTrigger id="cmp_matter">
            <SelectValue placeholder={clientId ? 'Select a case' : 'Pick a client first'} />
          </SelectTrigger>
          <SelectContent>
            {clientMatters.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.file_ref} — {m.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
