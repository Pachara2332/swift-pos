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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    fetch('/api/store')
      .then((response) => response.json())
      .then((data) => {
        if (active) setStore(data)
      })
      .catch(() => {
        if (active) setStore(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  if (loading) return null

  if (!isStoreReady(store)) {
    return <StoreOnboarding initialStore={store} onComplete={() => window.location.reload()} />
  }

  return (
    <Suspense fallback={null}>
      <POSPageContent />
    </Suspense>
  )
}
