'use client'

import Link from 'next/link'
import { BarChart3, Languages, List, PackagePlus, ShieldCheck, ShoppingCart, Zap } from 'lucide-react'
import RoleSwitcher from '@/components/RoleSwitcher'
import { I18nProvider, useI18n, type Language } from '@/lib/i18n'

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <AppShellContent>{children}</AppShellContent>
    </I18nProvider>
  )
}

function AppShellContent({ children }: { children: React.ReactNode }) {
  const { language, setLanguage, t } = useI18n()

  return (
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
          <Link href="/" className="nav-link">
            <ShoppingCart size={18} />
            {t('nav.pos')}
          </Link>

          <Link href="/dashboard" className="nav-link">
            <BarChart3 size={18} />
            {t('nav.dashboard')}
          </Link>

          <Link href="/products/add" className="nav-link">
            <PackagePlus size={18} />
            {t('nav.addProduct')}
          </Link>

          <Link href="/products" className="nav-link">
            <List size={18} />
            {t('nav.inventory')}
          </Link>

          <Link href="/roles" className="nav-link">
            <ShieldCheck size={18} />
            {t('nav.roles')}
          </Link>
        </nav>

        <LanguageSwitcher language={language} setLanguage={setLanguage} />
        <RoleSwitcher />
      </aside>

      <main className="app-main">
        {children}
      </main>
    </div>
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
