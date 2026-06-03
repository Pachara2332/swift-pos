import { ShieldCheck } from 'lucide-react'
import RoleSecurityPanel from '@/components/RoleSecurityPanel'

const roles = [
  {
    name: 'Admin',
    note: 'Full store control',
    permissions: ['Sell products', 'View inventory', 'Edit products', 'Open dashboard', 'Manage roles'],
  },
  {
    name: 'Manager',
    note: 'Operations and reporting',
    permissions: ['Sell products', 'View inventory', 'Open dashboard', 'Review low stock'],
  },
  {
    name: 'Cashier',
    note: 'Front counter workflow',
    permissions: ['Sell products', 'View inventory'],
  },
]

export default function RolesPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Role Permissions</h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>RBAC model for Admin, Manager, and Cashier access</p>
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
                <p style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{role.note}</p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {role.permissions.map((permission) => (
                <div key={permission} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', padding: '0.6rem 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.9rem' }}>{permission}</span>
                  <span className="badge badge-success">Allow</span>
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
