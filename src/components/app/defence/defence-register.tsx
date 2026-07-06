'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'

export type DefenceMatterRow = {
  id: string
  file_ref: string
  title: string
  client_name: string
  case_type_name: string
}

export function DefenceRegister({ matters }: { matters: DefenceMatterRow[] }) {
  const [q, setQ] = useState('')
  const filtered = useMemo(() => {
    const n = q.toLowerCase()
    if (!n) return matters
    return matters.filter((m) =>
      [m.file_ref, m.title, m.client_name, m.case_type_name].join(' ').toLowerCase().includes(n)
    )
  }, [matters, q])

  return (
    <div className="space-y-4">
      <div className="relative max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search cases…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
      </div>

      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>File ref</TableHead>
              <TableHead>Matter</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Case type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length ? (
              filtered.map((m) => (
                <TableRow key={m.id} className="cursor-pointer transition-colors hover:bg-brand-navy/[0.02]">
                  <TableCell>
                    <Link href={`/defence/${m.id}`} className="font-mono text-xs text-brand-gold hover:underline">
                      {m.file_ref}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/defence/${m.id}`} className="font-medium text-brand-navy hover:underline">
                      {m.title}
                    </Link>
                  </TableCell>
                  <TableCell>{m.client_name}</TableCell>
                  <TableCell className="text-muted-foreground">{m.case_type_name || '—'}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  No cases.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
