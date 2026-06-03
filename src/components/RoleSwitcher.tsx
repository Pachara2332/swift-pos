'use client'

import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'

const roles = ['Admin', 'Manager', 'Cashier'] as const

export default function RoleSwitcher() {
  const [role, setRole] = useState<(typeof roles)[number]>(() => {
    if (typeof window === 'undefined') return 'Admin'
    const stored = window.localStorage.getItem('swift-pos-role')
    if (stored === 'Admin' || stored === 'Manager' || stored === 'Cashier') {
      return stored
    }
    return 'Admin'
  })

  const handleChange = (nextRole: string) => {
    if (nextRole === 'Admin' || nextRole === 'Manager' || nextRole === 'Cashier') {
      setRole(nextRole)
      window.localStorage.setItem('swift-pos-role', nextRole)
    }
  }

  return (
    <div className="role-switcher">
      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.55)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
        <ShieldCheck size={14} />
        Active Role
      </label>
      <select
        value={role}
        onChange={(event) => handleChange(event.target.value)}
        style={{
          width: '100%',
          border: '1px solid rgba(255,255,255,0.16)',
          background: 'rgba(255,255,255,0.08)',
          color: '#fff',
          borderRadius: 'var(--radius-sm)',
          padding: '0.65rem 0.75rem',
          outline: 'none',
        }}
      >
        {roles.map((item) => (
          <option key={item} value={item} style={{ color: '#111827' }}>
            {item}
          </option>
        ))}
      </select>
    </div>
  )
}
