export const storeRoles = ['Admin', 'Manager', 'Cashier'] as const

export type StoreRole = (typeof storeRoles)[number]

export function isStoreRole(value: unknown): value is StoreRole {
  return typeof value === 'string' && storeRoles.includes(value as StoreRole)
}
