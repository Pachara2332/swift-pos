'use client'

import { Suspense, useEffect, useState } from 'react'
import StoreOnboarding from '@/components/StoreOnboarding'
import POSPageContent from '@/components/pos/POSPageContent'

type StoreSetupState = {
  name?: string | null
  ownerPhone?: string | null
  address?: string | null
  provinceId?: number | null
  districtId?: number | null
  subDistrictId?: number | null
}

function isStoreReady(store: StoreSetupState | null) {
  return Boolean(store?.name && store.ownerPhone && store.provinceId && store.districtId && store.subDistrictId)
}

export default function POSPage() {
  const [store, setStore] = useState<StoreSetupState | null>(null)
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    Promise.all([
      fetch('/api/store').then((response) => response.json()),
      fetch('/api/roles/session').then((response) => response.json()).catch(() => ({ authenticated: false })),
    ])
      .then(([storeData, sessionData]) => {
        if (!active) return
        setStore(storeData)
        setAuthenticated(Boolean(sessionData.authenticated))
      })
      .catch(() => {
        if (!active) return
        setStore(null)
        setAuthenticated(false)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    const refreshSession = () => {
      fetch('/api/roles/session')
        .then((response) => response.json())
        .then((sessionData) => {
          if (active) setAuthenticated(Boolean(sessionData.authenticated))
        })
        .catch(() => {
          if (active) setAuthenticated(false)
        })
    }
    window.addEventListener('swift-pos-role-session-change', refreshSession)

    return () => {
      active = false
      window.removeEventListener('swift-pos-role-session-change', refreshSession)
    }
  }, [])

  if (loading) return null

  if (!isStoreReady(store)) {
    return <StoreOnboarding initialStore={store} onComplete={() => window.location.reload()} />
  }

  if (!authenticated) {
    return (
      <section className="card" style={{ maxWidth: 560, margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>ปลดล็อกบทบาทก่อนใช้งาน</h1>
        <p style={{ color: 'var(--muted)', lineHeight: 1.7 }}>
          เลือกบทบาทที่แถบซ้ายแล้วกดปลดล็อกด้วยรหัสผ่าน บิลขาย สต็อก แดชบอร์ด และสมุดลูกหนี้จะเรียก API ได้หลังมี server session เท่านั้น
        </p>
      </section>
    )
  }

  return (
    <Suspense fallback={null}>
      <POSPageContent />
    </Suspense>
  )
}
