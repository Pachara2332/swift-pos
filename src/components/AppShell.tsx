'use client'

import { useCallback, useMemo, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { AlertTriangle, BarChart3, Barcode, ChevronDown, Languages, List, PackagePlus, Scale, ShieldCheck, ShoppingCart, Users, Zap } from 'lucide-react'
import { usePathname } from 'next/navigation'
import RoleSwitcher from '@/components/RoleSwitcher'
import { I18nProvider, useI18n, type Language } from '@/lib/i18n'
import { isStoreRole, type StoreRole } from '@/lib/role-constants'
import { ActiveRoleProvider } from '@/lib/role-context'

type NavItem = {
  href: string
  labelKey: string
  icon: React.ReactNode
  roles: StoreRole[]
}

const navItems: NavItem[] = [
  {
    href: '/',
    labelKey: 'nav.pos',
    icon: <ShoppingCart size={18} />,
    roles: ['Admin', 'Manager', 'Cashier'],
  },
  {
    href: '/products',
    labelKey: 'nav.inventory',
    icon: <List size={18} />,
    roles: ['Admin', 'Manager', 'Cashier'],
  },
  {
    href: '/dashboard',
    labelKey: 'permission.openDashboard',
    icon: <BarChart3 size={18} />,
    roles: ['Admin', 'Manager'],
  },
  {
    href: '/products?filter=low-stock',
    labelKey: 'permission.reviewLowStock',
    icon: <AlertTriangle size={18} />,
    roles: ['Admin', 'Manager'],
  },
  {
    href: '/barcodes',
    labelKey: 'nav.barcodes',
    icon: <Barcode size={18} />,
    roles: ['Admin', 'Manager'],
  },
  {
    href: '/products/add',
    labelKey: 'nav.addProduct',
    icon: <PackagePlus size={18} />,
    roles: ['Admin'],
  },
  {
    href: '/roles',
    labelKey: 'nav.roles',
    icon: <ShieldCheck size={18} />,
    roles: ['Admin'],
  },
]

const posSubItems = [
  { href: '/', labelKey: 'nav.posCounter', icon: <ShoppingCart size={16} /> },
  { href: '/?tool=weight', labelKey: 'nav.posWeight', icon: <Scale size={16} /> },
  { href: '/?tool=quick-product', labelKey: 'nav.posQuickProduct', icon: <PackagePlus size={16} /> },
  { href: '/?tool=debt', labelKey: 'nav.posDebt', icon: <Users size={16} /> },
]

const roleStorageKey = 'swift-pos-role'
const roleChangeEvent = 'swift-pos-role-change'

function getStoredRole(): StoreRole {
  if (typeof window === 'undefined') return 'Admin'

  const stored = window.localStorage.getItem(roleStorageKey)
  return isStoreRole(stored) ? stored : 'Admin'
}

function subscribeToRole(callback: () => void) {
  window.addEventListener('storage', callback)
  window.addEventListener(roleChangeEvent, callback)

  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener(roleChangeEvent, callback)
  }
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <AppShellContent>{children}</AppShellContent>
    </I18nProvider>
  )
}

function AppShellContent({ children }: { children: React.ReactNode }) {
  const { language, setLanguage, t } = useI18n()
  const pathname = usePathname()
  const role = useSyncExternalStore<StoreRole>(subscribeToRole, getStoredRole, () => 'Admin')
  const [posMenuOpen, setPosMenuOpen] = useState(() => pathname === '/')
  const setRole = useCallback((nextRole: StoreRole) => {
    window.localStorage.setItem(roleStorageKey, nextRole)
    window.dispatchEvent(new Event(roleChangeEvent))
  }, [])
  const visibleNavItems = useMemo(() => navItems.filter((item) => item.roles.includes(role)), [role])

  return (
    <ActiveRoleProvider role={role} setRole={setRole}>
      <div className="app-shell">
      <aside className="app-sidebar">
        <div className="app-brand">
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px 12px 8px 10px',
            background: '#d9a441',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '4px 6px 0 rgba(0, 0, 0, 0.18)',
          }}>
            <Zap size={20} color="#1f2a33" />
          </div>
          <div>
            <h1 style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: 0,
            }}>Swift POS</h1>
            <p style={{
              fontSize: '0.65rem',
              color: 'rgba(255,255,255,0.45)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              fontWeight: 500,
            }}>{t('app.tagline')}</p>
          </div>
        </div>

        <p className="nav-section-label">{t('nav.menu')}</p>

        <nav className="app-nav">
          {visibleNavItems.map((item) => {
            if (item.href !== '/') {
              return (
                <Link key={item.href} href={item.href} className="nav-link">
                  {item.icon}
                  {t(item.labelKey)}
                </Link>
              )
            }

            return (
              <div key={item.href} className={`nav-group ${posMenuOpen ? 'open' : ''}`}>
                <div className="nav-parent-row">
                  <Link href={item.href} className="nav-link nav-parent-link" onClick={() => setPosMenuOpen(true)}>
                    {item.icon}
                    {t(item.labelKey)}
                  </Link>
                  <button
                    type="button"
                    className="nav-expand-button"
                    aria-label={posMenuOpen ? t('nav.collapsePos') : t('nav.expandPos')}
                    onClick={() => setPosMenuOpen((open) => !open)}
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>
                {posMenuOpen && (
                  <div className="nav-submenu">
                    {posSubItems.map((subItem) => (
                      <Link key={subItem.href} href={subItem.href} className="nav-sub-link">
                        {subItem.icon}
                        {t(subItem.labelKey)}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        <LanguageSwitcher language={language} setLanguage={setLanguage} />
        <RoleSwitcher role={role} onRoleChange={setRole} />
      </aside>

      <main className="app-main">
        {children}
      </main>
      </div>
    </ActiveRoleProvider>
  )
}

function LanguageSwitcher({ language, setLanguage }: { language: Language; setLanguage: (language: Language) => void }) {
  const { t } = useI18n()

  return (
    <div className="language-switcher">
      <label>
        <Languages size={14} />
        {t('language.label')}
      </label>
      <div className="language-options">
        <button type="button" className={language === 'th' ? 'active' : ''} onClick={() => setLanguage('th')}>
          {t('language.th')}
        </button>
        <button type="button" className={language === 'en' ? 'active' : ''} onClick={() => setLanguage('en')}>
          {t('language.en')}
        </button>
      </div>
    </div>
  )
}
