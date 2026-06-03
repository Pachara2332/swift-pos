'use client'

import { createContext, useContext } from 'react'
import type { StoreRole } from '@/lib/role-constants'

type ActiveRoleContextValue = {
  role: StoreRole
  setRole: (role: StoreRole) => void
}

const ActiveRoleContext = createContext<ActiveRoleContextValue | null>(null)

export function ActiveRoleProvider({ children, role, setRole }: ActiveRoleContextValue & { children: React.ReactNode }) {
  return (
    <ActiveRoleContext.Provider value={{ role, setRole }}>
      {children}
    </ActiveRoleContext.Provider>
  )
}

export function useActiveRole() {
  const context = useContext(ActiveRoleContext)
  if (!context) {
    throw new Error('useActiveRole must be used inside ActiveRoleProvider')
  }
  return context
}
