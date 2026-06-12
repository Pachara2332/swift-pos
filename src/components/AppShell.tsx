'use client'

import { useCallback, useEffect, useMemo, useState, Suspense } from 'react'
import Link from 'next/link'
import { AlertTriangle, BarChart3, Barcode, ChevronDown, Languages, List, Menu, MoreHorizontal, PackagePlus, Scale, ShieldCheck, ShoppingCart, Users, X, Zap } from 'lucide-react'
import { usePathname, useSearchParams } from 'next/navigation'
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
const roleSessionChangeEvent = 'swift-pos-role-session-change'

function getStoredRole(): StoreRole {
  if (typeof window === 'undefined') return 'Cashier'

  const stored = window.localStorage.getItem(roleStorageKey)
  return isStoreRole(stored) ? stored : 'Cashier'
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
  const [role, setRoleState] = useState<StoreRole>('Cashier')
  const [authenticated, setAuthenticated] = useState(false)
  const [posMenuOpen, setPosMenuOpen] = useState(() => pathname === '/')
  const [mobileRoleModalOpen, setMobileRoleModalOpen] = useState(false)
  const [mobileMenuModalOpen, setMobileMenuModalOpen] = useState(false)

  useEffect(() => {
    let active = true
    fetch('/api/roles/session')
      .then((response) => response.json())
      .then((session) => {
        if (!active) return
        if (session.authenticated && isStoreRole(session.role)) {
          setRoleState(session.role)
          setAuthenticated(true)
          window.localStorage.setItem(roleStorageKey, session.role)
        } else {
          setRoleState(getStoredRole())
          setAuthenticated(false)
        }
      })
      .catch(() => {
        if (active) setAuthenticated(false)
      })

    return () => {
      active = false
    }
  }, [])

  const setRole = useCallback((nextRole: StoreRole) => {
    setRoleState(nextRole)
    setAuthenticated(true)
    window.localStorage.setItem(roleStorageKey, nextRole)
    window.dispatchEvent(new Event(roleSessionChangeEvent))
  }, [])

  const logoutRole = useCallback(() => {
    fetch('/api/roles/session', { method: 'DELETE' }).finally(() => {
      setAuthenticated(false)
      window.dispatchEvent(new Event(roleSessionChangeEvent))
    })
  }, [])

  const visibleNavItems = useMemo(() => navItems.filter((item) => item.roles.includes(role)), [role])

  const menuItems = useMemo(() => {
    return visibleNavItems.filter((item) => item.href !== '/' && item.href !== '/products')
  }, [visibleNavItems])

  const hasMoreMenu = menuItems.length > 0

  return (
    <ActiveRoleProvider role={role} setRole={setRole}>
      <div className="app-shell">
        {/* Mobile top header */}
        <header className="app-mobile-header">
          <div className="app-mobile-header-brand">
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px 8px 6px 7px',
              background: '#d9a441',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '2px 3px 0 rgba(0, 0, 0, 0.18)',
            }}>
              <Zap size={15} color="#1f2a33" />
            </div>
            <h1>Swift POS</h1>
          </div>
          <button
            type="button"
            className="app-mobile-header-role-badge"
            onClick={() => setMobileRoleModalOpen(true)}
          >
            <ShieldCheck size={12} />
            <span>{role}</span>
          </button>
        </header>

        {/* Desktop sidebar */}
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
          <RoleSwitcher role={role} authenticated={authenticated} onRoleChange={setRole} onLogout={logoutRole} />
        </aside>

        {/* Mobile floating sub-chips bar (POS submenus) */}
        {pathname === '/' && (
          <Suspense fallback={null}>
            <MobilePosSubChips />
          </Suspense>
        )}

        {/* Mobile Floating Bottom Tab Bar */}
        <div className="app-mobile-bottom-bar">
          <Link href="/" className={`app-mobile-tab ${pathname === '/' ? 'active' : ''}`}>
            <div className="app-mobile-tab-icon"><ShoppingCart size={20} /></div>
            <span className="app-mobile-tab-label">{t('nav.pos')}</span>
          </Link>
          
          <Link href="/products" className={`app-mobile-tab ${pathname.startsWith('/products') ? 'active' : ''}`}>
            <div className="app-mobile-tab-icon"><List size={20} /></div>
            <span className="app-mobile-tab-label">{t('nav.inventory')}</span>
          </Link>

          <button
            type="button"
            className={`app-mobile-tab ${mobileRoleModalOpen ? 'active' : ''}`}
            onClick={() => setMobileRoleModalOpen(true)}
          >
            <div className="app-mobile-tab-icon"><ShieldCheck size={20} /></div>
            <span className="app-mobile-tab-label">{role}</span>
          </button>

          {hasMoreMenu && (
            <button
              type="button"
              className={`app-mobile-tab ${mobileMenuModalOpen ? 'active' : ''}`}
              onClick={() => setMobileMenuModalOpen(true)}
            >
              <div className="app-mobile-tab-icon"><Menu size={20} /></div>
              <span className="app-mobile-tab-label">{t('nav.menu')}</span>
            </button>
          )}
        </div>

        {/* Role & Language Modal Overlay */}
        <div
          className={`mobile-glass-modal-overlay ${mobileRoleModalOpen ? 'open' : ''}`}
          onClick={() => setMobileRoleModalOpen(false)}
        >
          <div className="mobile-glass-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-glass-modal-header">
              <h3>{t('role.active')} / {t('language.label')}</h3>
              <button
                type="button"
                className="mobile-glass-modal-close"
                onClick={() => setMobileRoleModalOpen(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            
            <RoleSwitcher
              role={role}
              authenticated={authenticated}
              onRoleChange={(nextRole) => {
                setRole(nextRole)
                setMobileRoleModalOpen(false)
              }}
              onLogout={() => {
                logoutRole()
                setMobileRoleModalOpen(false)
              }}
            />
            
            <div style={{ marginTop: '1.5rem' }}>
              <LanguageSwitcher language={language} setLanguage={setLanguage} />
            </div>
          </div>
        </div>

        {/* More Menu Modal Overlay */}
        {hasMoreMenu && (
          <div
            className={`mobile-glass-modal-overlay ${mobileMenuModalOpen ? 'open' : ''}`}
            onClick={() => setMobileMenuModalOpen(false)}
          >
            <div className="mobile-glass-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="mobile-glass-modal-header">
                <h3>{t('nav.menu')}</h3>
                <button
                  type="button"
                  className="mobile-glass-modal-close"
                  onClick={() => setMobileMenuModalOpen(false)}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
              
              <div className="mobile-menu-grid">
                {menuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="mobile-menu-card"
                    onClick={() => setMobileMenuModalOpen(false)}
                  >
                    <div className="mobile-menu-card-icon">
                      {item.icon}
                    </div>
                    <div className="mobile-menu-card-label">
                      {t(item.labelKey)}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

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

function MobilePosSubChips() {
  const searchParams = useSearchParams()
  const currentTool = searchParams.get('tool') || 'sale'
  const { t } = useI18n()

  const subItems = [
    { tool: 'sale', href: '/', labelKey: 'nav.posCounter', icon: <ShoppingCart size={14} /> },
    { tool: 'weight', href: '/?tool=weight', labelKey: 'nav.posWeight', icon: <Scale size={14} /> },
    { tool: 'quick-product', href: '/?tool=quick-product', labelKey: 'nav.posQuickProduct', icon: <PackagePlus size={14} /> },
    { tool: 'debt', href: '/?tool=debt', labelKey: 'nav.posDebt', icon: <Users size={14} /> },
  ]

  return (
    <div className="pos-sub-chips-container">
      {subItems.map((item) => (
        <Link
          key={item.tool}
          href={item.href}
          className={`pos-sub-chip ${currentTool === item.tool ? 'active' : ''}`}
        >
          {item.icon}
          <span>{t(item.labelKey)}</span>
        </Link>
      ))}
    </div>
  )
}
