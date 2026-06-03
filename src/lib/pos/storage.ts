export const heldBillsKey = 'swift-pos-held-bills'
export const customersKey = 'swift-pos-debt-customers'
export const debtEntriesKey = 'swift-pos-debt-entries'
export const offlineSalesKey = 'swift-pos-offline-sales'
export const completedSalesKey = 'swift-pos-completed-sales'

export function readStoredArray<T>(key: string): T[] {
  if (typeof window === 'undefined') return []

  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) ?? '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function writeStoredArray<T>(key: string, value: T[]) {
  window.localStorage.setItem(key, JSON.stringify(value))
}
