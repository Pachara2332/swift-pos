'use client'

import { Suspense } from 'react'
import POSPageContent from '@/components/pos/POSPageContent'

export default function POSPage() {
  return (
    <Suspense fallback={null}>
      <POSPageContent />
    </Suspense>
  )
}
