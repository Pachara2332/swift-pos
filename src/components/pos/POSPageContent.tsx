'use client'

import { useSearchParams } from 'next/navigation'
import PosMainColumn from '@/components/pos/PosMainColumn'
import PosSideColumn from '@/components/pos/PosSideColumn'
import PosToast from '@/components/pos/PosToast'
import { useI18n } from '@/lib/i18n'
import type { PosTool } from '@/lib/pos/types'
import { usePosController } from '@/lib/pos/usePosController'

const posTools: PosTool[] = ['sale', 'weight', 'quick-product', 'debt']

function parsePosTool(value: string | null): PosTool {
  return value && posTools.includes(value as PosTool) ? value as PosTool : 'sale'
}

export default function POSPageContent() {
  const { t } = useI18n()
  const searchParams = useSearchParams()
  const activeTool = parsePosTool(searchParams.get('tool'))
  const { shellClassName, toastProps, mainColumnProps, sideColumnProps } = usePosController({ activeTool, t })

  return (
    <div className={shellClassName}>
      <PosToast {...toastProps} />
      <PosMainColumn {...mainColumnProps} />
      <PosSideColumn {...sideColumnProps} />
    </div>
  )
}
