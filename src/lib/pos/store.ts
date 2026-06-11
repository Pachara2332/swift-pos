import { create } from 'zustand'
import {
  completedSalesKey,
  heldBillsKey,
  offlineSalesKey,
  readStoredArray,
} from '@/lib/pos/storage'
import type {
  CartItem,
  CurrentSaleEvent,
  DebtCustomer,
  DebtEntry,
  HeldBill,
  LastReceipt,
  LiveStatus,
  NotificationState,
  OfflineSale,
  Product,
  ScanFeedback,
} from '@/lib/pos/types'

type Updater<T> = T | ((previous: T) => T)

function resolveUpdater<T>(next: Updater<T>, previous: T): T {
  return typeof next === 'function' ? (next as (previous: T) => T)(previous) : next
}

type PosStore = {
  seniorMode: boolean
  products: Product[]
  barcodeInput: string
  productSearch: string
  quickTab: string
  cart: CartItem[]
  heldBills: HeldBill[]
  customers: DebtCustomer[]
  debtEntries: DebtEntry[]
  offlineSales: OfflineSale[]
  completedSales: LastReceipt[]
  showCamera: boolean
  loading: boolean
  notification: NotificationState | null
  scanFeedback: ScanFeedback | null
  lastReceipt: LastReceipt | null
  liveStatus: LiveStatus
  remoteSale: CurrentSaleEvent | null
  weightedProductId: string
  weightKg: string
  receivedAmount: string
  selectedCustomerId: string
  newCustomerName: string
  debtPaymentAmount: string
  quickProductName: string
  quickProductPrice: string
  quickProductCategory: string
  setSeniorMode: (next: Updater<boolean>) => void
  setProducts: (next: Updater<Product[]>) => void
  setBarcodeInput: (next: Updater<string>) => void
  setProductSearch: (next: Updater<string>) => void
  setQuickTab: (next: Updater<string>) => void
  setCart: (next: Updater<CartItem[]>) => void
  setHeldBills: (next: Updater<HeldBill[]>) => void
  setCustomers: (next: Updater<DebtCustomer[]>) => void
  setDebtEntries: (next: Updater<DebtEntry[]>) => void
  setOfflineSales: (next: Updater<OfflineSale[]>) => void
  setCompletedSales: (next: Updater<LastReceipt[]>) => void
  setShowCamera: (next: Updater<boolean>) => void
  setLoading: (next: Updater<boolean>) => void
  setNotification: (next: Updater<NotificationState | null>) => void
  setScanFeedback: (next: Updater<ScanFeedback | null>) => void
  setLastReceipt: (next: Updater<LastReceipt | null>) => void
  setLiveStatus: (next: Updater<LiveStatus>) => void
  setRemoteSale: (next: Updater<CurrentSaleEvent | null>) => void
  setWeightedProductId: (next: Updater<string>) => void
  setWeightKg: (next: Updater<string>) => void
  setReceivedAmount: (next: Updater<string>) => void
  setSelectedCustomerId: (next: Updater<string>) => void
  setNewCustomerName: (next: Updater<string>) => void
  setDebtPaymentAmount: (next: Updater<string>) => void
  setQuickProductName: (next: Updater<string>) => void
  setQuickProductPrice: (next: Updater<string>) => void
  setQuickProductCategory: (next: Updater<string>) => void
}

export const usePosStore = create<PosStore>((set) => ({
  seniorMode: false,
  products: [],
  barcodeInput: '',
  productSearch: '',
  quickTab: 'ขายดี',
  cart: [],
  heldBills: readStoredArray<HeldBill>(heldBillsKey),
  customers: [],
  debtEntries: [],
  offlineSales: readStoredArray<OfflineSale>(offlineSalesKey),
  completedSales: readStoredArray<LastReceipt>(completedSalesKey),
  showCamera: false,
  loading: false,
  notification: null,
  scanFeedback: null,
  lastReceipt: null,
  liveStatus: 'connecting',
  remoteSale: null,
  weightedProductId: '',
  weightKg: '0.5',
  receivedAmount: '',
  selectedCustomerId: '',
  newCustomerName: '',
  debtPaymentAmount: '',
  quickProductName: '',
  quickProductPrice: '',
  quickProductCategory: 'ของชำ',
  setSeniorMode: (next) => set((state) => ({ seniorMode: resolveUpdater(next, state.seniorMode) })),
  setProducts: (next) => set((state) => ({ products: resolveUpdater(next, state.products) })),
  setBarcodeInput: (next) => set((state) => ({ barcodeInput: resolveUpdater(next, state.barcodeInput) })),
  setProductSearch: (next) => set((state) => ({ productSearch: resolveUpdater(next, state.productSearch) })),
  setQuickTab: (next) => set((state) => ({ quickTab: resolveUpdater(next, state.quickTab) })),
  setCart: (next) => set((state) => ({ cart: resolveUpdater(next, state.cart) })),
  setHeldBills: (next) => set((state) => ({ heldBills: resolveUpdater(next, state.heldBills) })),
  setCustomers: (next) => set((state) => ({ customers: resolveUpdater(next, state.customers) })),
  setDebtEntries: (next) => set((state) => ({ debtEntries: resolveUpdater(next, state.debtEntries) })),
  setOfflineSales: (next) => set((state) => ({ offlineSales: resolveUpdater(next, state.offlineSales) })),
  setCompletedSales: (next) => set((state) => ({ completedSales: resolveUpdater(next, state.completedSales) })),
  setShowCamera: (next) => set((state) => ({ showCamera: resolveUpdater(next, state.showCamera) })),
  setLoading: (next) => set((state) => ({ loading: resolveUpdater(next, state.loading) })),
  setNotification: (next) => set((state) => ({ notification: resolveUpdater(next, state.notification) })),
  setScanFeedback: (next) => set((state) => ({ scanFeedback: resolveUpdater(next, state.scanFeedback) })),
  setLastReceipt: (next) => set((state) => ({ lastReceipt: resolveUpdater(next, state.lastReceipt) })),
  setLiveStatus: (next) => set((state) => ({ liveStatus: resolveUpdater(next, state.liveStatus) })),
  setRemoteSale: (next) => set((state) => ({ remoteSale: resolveUpdater(next, state.remoteSale) })),
  setWeightedProductId: (next) => set((state) => ({ weightedProductId: resolveUpdater(next, state.weightedProductId) })),
  setWeightKg: (next) => set((state) => ({ weightKg: resolveUpdater(next, state.weightKg) })),
  setReceivedAmount: (next) => set((state) => ({ receivedAmount: resolveUpdater(next, state.receivedAmount) })),
  setSelectedCustomerId: (next) => set((state) => ({ selectedCustomerId: resolveUpdater(next, state.selectedCustomerId) })),
  setNewCustomerName: (next) => set((state) => ({ newCustomerName: resolveUpdater(next, state.newCustomerName) })),
  setDebtPaymentAmount: (next) => set((state) => ({ debtPaymentAmount: resolveUpdater(next, state.debtPaymentAmount) })),
  setQuickProductName: (next) => set((state) => ({ quickProductName: resolveUpdater(next, state.quickProductName) })),
  setQuickProductPrice: (next) => set((state) => ({ quickProductPrice: resolveUpdater(next, state.quickProductPrice) })),
  setQuickProductCategory: (next) => set((state) => ({ quickProductCategory: resolveUpdater(next, state.quickProductCategory) })),
}))
