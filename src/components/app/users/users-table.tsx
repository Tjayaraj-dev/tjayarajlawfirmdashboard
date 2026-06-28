'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { setUserRole } from '@/lib/users/actions'
import type { Role } from '@/lib/auth/roles'

type UserRow = { id: string; full_name: string; email: string; role: Role }

export function UsersTable({
  users,
  currentUserId,
}: {
  users: UserRow[]
  currentUserId: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const change = (id: string, role: Role) => {
    startTransition(async () => {
      const { error } = await setUserRole(id, role)
      if (error) {
        toast.error(error)
        return
      }
      toast.success('Role updated')
      router.refresh()
    })
  }

  return (
    <div className="rounded-lg border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => {
            const isSelf = u.id === currentUserId
            return (
              <TableRow key={u.id}>
                <TableCell className="font-medium text-brand-navy">
                  {u.full_name}
                  {isSelf && (
                    <Badge variant="outline" className="ml-2 text-[10px]">you</Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">{u.email}</TableCell>
                <TableCell>
                  {isSelf ? (
                    <Badge variant="outline" className="text-[10px] capitalize">{u.role}</Badge>
                  ) : (
                    <Select
                      value={u.role}
                      onValueChange={(v) => change(u.id, (v ?? 'staff') as Role)}
                      disabled={pending}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
