'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import { Lock, ShieldCheck, X } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { storeRoles, type StoreRole } from '@/lib/role-constants'

type RoleSwitcherProps = {
  role: StoreRole
  onRoleChange: (role: StoreRole) => void
}

export default function RoleSwitcher({ role, onRoleChange }: RoleSwitcherProps) {
  const { t } = useI18n()
  const [pendingRole, setPendingRole] = useState<StoreRole | null>(null)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (nextRole: string) => {
    if (nextRole === role) return
    if (nextRole === 'Admin' || nextRole === 'Manager' || nextRole === 'Cashier') {
      setPendingRole(nextRole)
      setPassword('')
      setError('')
    }
  }

  const closeDialog = () => {
    setPendingRole(null)
    setPassword('')
    setError('')
  }

  const confirmRole = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!pendingRole || !password) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/roles/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: pendingRole, password }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Unable to change role')
      }

      onRoleChange(pendingRole)
      closeDialog()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to change role')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="role-switcher">
      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.55)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
        <ShieldCheck size={14} />
        {t('role.active')}
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
        {storeRoles.map((item) => (
          <option key={item} value={item} style={{ color: '#111827' }}>
            {item}
          </option>
        ))}
      </select>
      {pendingRole && (
        <div className="role-dialog-backdrop" role="presentation">
          <form className="role-dialog" onSubmit={confirmRole}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: 34, height: 34, borderRadius: 'var(--radius-sm)', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Lock size={18} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1rem', fontWeight: 800 }}>{t('role.switchTo')} {pendingRole}</h2>
                  <p style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>{t('role.enterPassword')}</p>
                </div>
              </div>
              <button type="button" onClick={closeDialog} aria-label="Close role password dialog" style={{ color: 'var(--muted)' }}>
                <X size={18} />
              </button>
            </div>
            <input
              className="input-field"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoFocus
              placeholder={t('role.passwordPlaceholder')}
              style={{ width: '100%' }}
            />
            {error && <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.7rem' }}>{error}</p>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '1rem' }}>
              <button type="button" className="btn btn-quiet" onClick={closeDialog}>{t('role.cancel')}</button>
              <button type="submit" className="btn btn-primary" disabled={loading || password.length === 0}>
                {loading ? t('role.checking') : t('role.unlock')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
