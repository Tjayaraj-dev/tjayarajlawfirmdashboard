'use client'

import { useMemo, useState, useTransition } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { MoreHorizontal, Plus, Search, Pencil, Archive, RotateCcw, Trash2 } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import {
  MatterFormDialog,
  type ClientOption,
  type CaseTypeOption,
  type CourtOption,
} from './matter-form-dialog'
import { softDeleteMatter, restoreMatter, hardDeleteMatter } from '@/lib/matters/actions'
import { MATTER_STATUSES, type MatterFormValues } from '@/lib/matters/schema'
import { formatDate, formatDateTime } from '@/lib/format-date'
import type { Database } from '@/lib/supabase/database.types'

type MatterBase = Database['public']['Tables']['matters']['Row']
export type MatterRow = MatterBase & { client: { name: string } | null }

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  on_hold: 'bg-amber-50 text-amber-700 border-amber-200',
  pending_filing: 'bg-blue-50 text-blue-700 border-blue-200',
  closed: 'bg-muted text-muted-foreground border-border',
}
const STATUS_LABELS = Object.fromEntries(
  MATTER_STATUSES.map((s) => [s.value, s.label])
)

// ISO timestamp -> value for <input type="datetime-local">
function toLocalInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function rowToForm(m: MatterRow) {
  return {
    id: m.id,
    values: {
      client_id: m.client_id,
      file_ref: m.file_ref,
      title: m.title,
      case_type_id: m.case_type_id ?? '',
      appointment_type: (m.appointment_type ?? '') as MatterFormValues['appointment_type'],
      court: m.court ?? '',
      status: m.status,
      opened_at: m.opened_at,
      next_hearing_at: toLocalInput(m.next_hearing_at),
      description: m.description ?? '',
    } satisfies MatterFormValues,
    customFields: (m.custom_fields ?? {}) as Record<string, string>,
  }
}

function RowActions({
  matter,
  isAdmin,
  onEdit,
}: {
  matter: MatterRow
  isAdmin: boolean
  onEdit: (m: MatterRow) => void
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const isDeleted = !!matter.deleted_at

  const archive = () => {
    if (!confirm(`Archive matter “${matter.file_ref}”? It can be restored by an admin.`)) return
    startTransition(async () => {
      const { error } = await softDeleteMatter(matter.id)
      if (error) {
        toast.error(error)
        return
      }
      toast.success('Matter archived')
      router.refresh()
    })
  }
  const restore = () => {
    startTransition(async () => {
      const { error } = await restoreMatter(matter.id)
      if (error) {
        toast.error(error)
        return
      }
      toast.success('Matter restored')
      router.refresh()
    })
  }

  const destroy = () => {
    if (
      !confirm(
        `Permanently delete matter “${matter.file_ref}”?\n\nThis also destroys its events and documents. It cannot be undone.`
      )
    )
      return
    startTransition(async () => {
      const { error } = await hardDeleteMatter(matter.id)
      if (error) {
        toast.error(error)
        return
      }
      toast.success('Matter permanently deleted')
      router.refresh()
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="sm" className="size-8 p-0" disabled={pending} />}
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {!isDeleted && (
          <>
            <DropdownMenuItem onClick={() => onEdit(matter)}>
              <Pencil className="size-3.5" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={archive} className="text-destructive">
              <Archive className="size-3.5" /> Archive
            </DropdownMenuItem>
          </>
        )}
        {isDeleted && isAdmin && (
          <DropdownMenuItem onClick={restore}>
            <RotateCcw className="size-3.5" /> Restore
          </DropdownMenuItem>
        )}
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={destroy} className="text-destructive">
              <Trash2 className="size-3.5" /> Delete permanently
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function MattersTable({
  matters,
  clients,
  caseTypes,
  courts,
  isAdmin,
}: {
  matters: MatterRow[]
  clients: ClientOption[]
  caseTypes: CaseTypeOption[]
  courts: CourtOption[]
  isAdmin: boolean
}) {
  const [globalFilter, setGlobalFilter] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<MatterRow | null>(null)

  const openCreate = () => {
    setEditing(null)
    setDialogOpen(true)
  }
  const openEdit = (m: MatterRow) => {
    setEditing(m)
    setDialogOpen(true)
  }

  const columns = useMemo<ColumnDef<MatterRow>[]>(
    () => [
      {
        accessorKey: 'file_ref',
        header: 'File ref',
        cell: ({ row }) => (
          <Link
            href={`/matters/${row.original.id}`}
            className="font-mono text-xs text-brand-navy underline-offset-2 hover:text-brand-gold hover:underline"
          >
            {row.original.file_ref}
          </Link>
        ),
      },
      {
        accessorKey: 'title',
        header: 'Matter',
        cell: ({ row }) => {
          const m = row.original
          return (
            <div className="flex items-center gap-2">
              <span className="font-medium text-brand-navy">{m.title}</span>
              {m.deleted_at && (
                <Badge variant="destructive" className="text-[10px]">Archived</Badge>
              )}
            </div>
          )
        },
      },
      {
        id: 'client',
        header: 'Client',
        cell: ({ row }) => row.original.client?.name ?? '—',
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant="outline" className={cn('text-[10px]', STATUS_STYLES[row.original.status])}>
            {STATUS_LABELS[row.original.status]}
          </Badge>
        ),
      },
      {
        accessorKey: 'next_hearing_at',
        header: 'Next hearing',
        cell: ({ row }) => (
          <span className="text-muted-foreground">{formatDateTime(row.original.next_hearing_at)}</span>
        ),
      },
      {
        accessorKey: 'opened_at',
        header: 'Opened',
        cell: ({ row }) => (
          <span className="text-muted-foreground">{formatDate(row.original.opened_at)}</span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex justify-end">
            <RowActions matter={row.original} isAdmin={isAdmin} onEdit={openEdit} />
          </div>
        ),
      },
    ],
    [isAdmin]
  )

  const table = useReactTable({
    data: matters,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _id, value) => {
      const m = row.original
      const haystack = [m.file_ref, m.title, m.client?.name, m.accused, m.court]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(String(value).toLowerCase())
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search matters…"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={openCreate} disabled={clients.length === 0}>
          <Plus className="size-4" /> Open matter
        </Button>
      </div>

      {clients.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Every matter belongs to a client.{' '}
          <Link href="/clients" className="font-medium text-brand-gold hover:underline">
            Add a client first →
          </Link>
        </p>
      )}

      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={row.original.deleted_at ? 'opacity-60' : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-28 text-center text-muted-foreground">
                  No matters yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <MatterFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        clients={clients}
        caseTypes={caseTypes}
        courts={courts}
        matter={editing ? rowToForm(editing) : undefined}
      />
    </div>
  )
}
