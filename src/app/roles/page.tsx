'use client'

import { ShieldCheck } from 'lucide-react'
import RoleSecurityPanel from '@/components/RoleSecurityPanel'
import { useI18n } from '@/lib/i18n'

const roles = [
  {
    name: 'Admin',
    noteKey: 'role.adminNote',
    permissions: ['permission.sell', 'permission.viewInventory', 'permission.editProducts', 'permission.openDashboard', 'permission.manageRoles'],
  },
  {
    name: 'Manager',
    noteKey: 'role.managerNote',
    permissions: ['permission.sell', 'permission.viewInventory', 'permission.openDashboard', 'permission.reviewLowStock'],
  },
  {
    name: 'Cashier',
    noteKey: 'role.cashierNote',
    permissions: ['permission.sell', 'permission.viewInventory'],
  },
]

export default function RolesPage() {
  const { t } = useI18n()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>{t('role.permissionsTitle')}</h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{t('role.permissionsSubtitle')}</p>
      </div>

      <div className="roles-grid">
        {roles.map((role) => (
          <section key={role.name} className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-sm)', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{role.name}</h2>
                <p style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{t(role.noteKey)}</p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {role.permissions.map((permission) => (
                <div key={permission} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', padding: '0.6rem 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.9rem' }}>{t(permission)}</span>
                  <span className="badge badge-success">{t('role.allow')}</span>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <RoleSecurityPanel />
    </div>
  )
}
