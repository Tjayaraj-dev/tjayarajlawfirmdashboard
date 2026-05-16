export type Role = 'admin' | 'staff'

export const ROLES = {
  ADMIN: 'admin',
  STAFF: 'staff',
} as const satisfies Record<string, Role>

export function isAdmin(role: Role | null | undefined): boolean {
  return role === ROLES.ADMIN
}

export function isStaff(role: Role | null | undefined): boolean {
  return role === ROLES.STAFF
}
