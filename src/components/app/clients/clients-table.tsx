'use client'

import { useMemo, useState, useTransition } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ClientFormDialog, type CaseTypeOption } from './client-form-dialog'
import {
  softDeleteClient,
  restoreClient,
  hardDeleteClient,
} from '@/lib/clients/actions'
import {
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import type { Database } from '@/lib/supabase/database.types'

export type ClientRow = Database['public']['Tables']['clients']['Row']

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-MY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function RowActions({
  client,
  isAdmin,
  onEdit,
}: {
  client: ClientRow
  isAdmin: boolean
  onEdit: (c: ClientRow) => void
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const isDeleted = !!client.deleted_at

  const archive = () => {
    if (!confirm(`Archive “${client.name}”? It can be restored by an admin.`)) return
    startTransition(async () => {
      const { error } = await softDeleteClient(client.id)
      if (error) {
        toast.error(error)
        return
      }
      toast.success('Client archived')
      router.refresh()
    })
  }

  const restore = () => {
    startTransition(async () => {
      const { error } = await restoreClient(client.id)
      if (error) {
        toast.error(error)
        return
      }
      toast.success('Client restored')
      router.refresh()
    })
  }

  const destroy = () => {
    if (
      !confirm(
        `Permanently delete “${client.name}”?\n\nThis also destroys ALL of this client's matters, events and documents. It cannot be undone.`
      )
    )
      return
    startTransition(async () => {
      const { error } = await hardDeleteClient(client.id)
      if (error) {
        toast.error(error)
        return
      }
      toast.success('Client permanently deleted')
      router.refresh()
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="size-8 p-0"
            disabled={pending}
          />
        }
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {!isDeleted && (
          <>
            <DropdownMenuItem onClick={() => onEdit(client)}>
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

export function ClientsTable({
  clients,
  caseTypes,
  isAdmin,
}: {
  clients: ClientRow[]
  caseTypes: CaseTypeOption[]
  isAdmin: boolean
}) {
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ClientRow | null>(null)

  const openCreate = () => {
    setEditing(null)
    setDialogOpen(true)
  }
  const openEdit = (c: ClientRow) => {
    setEditing(c)
    setDialogOpen(true)
  }

  const columns = useMemo<ColumnDef<ClientRow>[]>(
    () => [
      {
        id: 'client_code',
        header: 'Client ID',
        cell: ({ row }) => (
          <span className="font-mono text-xs text-brand-gold">
            {row.original.client_code ?? '—'}
          </span>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => {
          const c = row.original
          return (
            <div className="flex items-center gap-2">
              <span className="font-medium text-brand-navy">{c.name}</span>
              <Badge variant="outline" className="text-[10px] capitalize">
                {c.type}
              </Badge>
              {c.deleted_at && (
                <Badge variant="destructive" className="text-[10px]">
                  Archived
                </Badge>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: 'ic_or_company_no',
        header: 'NRIC / Company no.',
        cell: ({ row }) => row.original.ic_or_company_no ?? '—',
      },
      {
        accessorKey: 'phone',
        header: 'Phone',
        cell: ({ row }) => row.original.phone ?? '—',
      },
      {
        accessorKey: 'created_at',
        header: 'Added',
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {formatDate(row.original.created_at)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex justify-end">
            <RowActions client={row.original} isAdmin={isAdmin} onEdit={openEdit} />
          </div>
        ),
      },
    ],
    [isAdmin]
  )

  const table = useReactTable({
    data: clients,
    columns,
    state: { globalFilter, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    globalFilterFn: (row, _id, value) => {
      const c = row.original
      const haystack = [c.name, c.client_code, c.ic_or_company_no, c.phone, c.email, c.reference_no]
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
            placeholder="Search clients…"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" /> New client
        </Button>
      </div>

      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
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
                <TableCell
                  colSpan={columns.length}
                  className="h-28 text-center text-muted-foreground"
                >
                  No clients yet. Add the firm’s first client to begin.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ClientFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        caseTypes={caseTypes}
        client={
          editing
            ? {
                id: editing.id,
                name: editing.name,
                type: editing.type,
                ic_or_company_no: editing.ic_or_company_no ?? '',
                reference_no: editing.reference_no ?? '',
                phone: editing.phone ?? '',
                email: editing.email ?? '',
                address: editing.address ?? '',
                case_file_ref: '',
                case_type_id: '',
                case_details: '',
              }
            : undefined
        }
      />
    </div>
  )
}
