'use client'

import { useCallback, useEffect, useId, useMemo, useRef } from 'react'
import {
  completedSalesKey,
  heldBillsKey,
  offlineSalesKey,
  writeStoredArray,
} from '@/lib/pos/storage'
import { usePosStore } from '@/lib/pos/store'
import type {
  CurrentSaleEvent,
  DebtCustomer,
  DebtEntry,
  HeldBill,
  LastReceipt,
  OfflineSale,
  PosTool,
  Product,
  ProductChangedEvent,
  SalePayload,
} from '@/lib/pos/types'
import { buildSalePayload, escapeReceiptText, getUnitPricePerKg, isToday, money, newId } from '@/lib/pos/utils'

type UsePosControllerOptions = {
  activeTool: PosTool
  t: (key: string) => string
}

export function usePosController({ activeTool, t }: UsePosControllerOptions) {
  const {
    seniorMode,
    products,
    barcodeInput,
    productSearch,
    quickTab,
    cart,
    heldBills,
    customers,
    debtEntries,
    offlineSales,
    completedSales,
    showCamera,
    loading,
    notification,
    scanFeedback,
    lastReceipt,
    liveStatus,
    remoteSale,
    weightedProductId,
    weightKg,
    receivedAmount,
    selectedCustomerId,
    newCustomerName,
    debtPaymentAmount,
    quickProductName,
    quickProductPrice,
    quickProductCategory,
    setSeniorMode,
    setProducts,
    setBarcodeInput,
    setProductSearch,
    setQuickTab,
    setCart,
    setHeldBills,
    setCustomers,
    setDebtEntries,
    setOfflineSales,
    setCompletedSales,
    setShowCamera,
    setLoading,
    setNotification,
    setScanFeedback,
    setLastReceipt,
    setLiveStatus,
    setRemoteSale,
    setWeightedProductId,
    setWeightKg,
    setReceivedAmount,
    setSelectedCustomerId,
    setNewCustomerName,
    setDebtPaymentAmount,
    setQuickProductName,
    setQuickProductPrice,
    setQuickProductCategory,
  } = usePosStore()
  const inputRef = useRef<HTMLInputElement>(null)
  const offlineSyncInFlightRef = useRef(false)
  const sessionId = `pos-${useId()}`

  useEffect(() => {
    if (!showCamera) inputRef.current?.focus()
  }, [showCamera])

  const loadProducts = useCallback(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(() => setProducts([]))
  }, [setProducts])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  const loadDebtLedger = useCallback(() => {
    Promise.all([
      fetch('/api/debt/customers').then((res) => res.ok ? res.json() : []),
      fetch('/api/debt/entries').then((res) => res.ok ? res.json() : []),
    ])
      .then(([nextCustomers, nextEntries]) => {
        setCustomers(Array.isArray(nextCustomers) ? nextCustomers : [])
        setDebtEntries(Array.isArray(nextEntries) ? nextEntries : [])
      })
      .catch(() => {
        setCustomers([])
        setDebtEntries([])
      })
  }, [setCustomers, setDebtEntries])

  useEffect(() => {
    loadDebtLedger()
  }, [loadDebtLedger])

  useEffect(() => {
    const refreshAfterRoleChange = () => {
      loadProducts()
      loadDebtLedger()
    }

    window.addEventListener('swift-pos-role-session-change', refreshAfterRoleChange)
    return () => window.removeEventListener('swift-pos-role-session-change', refreshAfterRoleChange)
  }, [loadDebtLedger, loadProducts])

  useEffect(() => {
    const initialStatus = window.setTimeout(() => {
      if (!navigator.onLine) setLiveStatus('offline')
    }, 0)

    const markOnline = () => setLiveStatus('connecting')
    const markOffline = () => setLiveStatus('offline')
    window.addEventListener('online', markOnline)
    window.addEventListener('offline', markOffline)
    return () => {
      window.clearTimeout(initialStatus)
      window.removeEventListener('online', markOnline)
      window.removeEventListener('offline', markOffline)
    }
  }, [setLiveStatus])

  useEffect(() => {
    if (!notification) return

    const timer = window.setTimeout(() => setNotification(null), 3000)
    return () => window.clearTimeout(timer)
  }, [notification, setNotification])

  useEffect(() => {
    if (!scanFeedback) return

    const timer = window.setTimeout(() => setScanFeedback(null), 1200)
    return () => window.clearTimeout(timer)
  }, [scanFeedback, setScanFeedback])

  const playScanBeep = useCallback(() => {
    const AudioContextClass = window.AudioContext || (window as Window & {
      webkitAudioContext?: typeof AudioContext
    }).webkitAudioContext
    if (!AudioContextClass) return

    const audioContext = new AudioContextClass()
    const oscillator = audioContext.createOscillator()
    const gain = audioContext.createGain()

    oscillator.type = 'square'
    oscillator.frequency.value = 880
    gain.gain.setValueAtTime(0.0001, audioContext.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.08, audioContext.currentTime + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.12)
    oscillator.connect(gain)
    gain.connect(audioContext.destination)
    oscillator.start()
    oscillator.stop(audioContext.currentTime + 0.13)
    window.setTimeout(() => audioContext.close().catch(() => undefined), 220)
  }, [])

  useEffect(() => {
    const events = new EventSource('/api/realtime')

    events.addEventListener('connected', () => setLiveStatus(navigator.onLine ? 'live' : 'offline'))
    events.addEventListener('product.changed', (event) => {
      const data = JSON.parse(event.data) as ProductChangedEvent
      loadProducts()
      setCart((prev) => prev.map((item) => {
        if (item.productId !== data.product.id && item.barcode !== data.product.barcode) return item
        return { ...item, name: data.product.name, price: data.product.salePrice }
      }))
    })
    events.addEventListener('current-sale.updated', (event) => {
      const data = JSON.parse(event.data) as CurrentSaleEvent
      if (data.sessionId !== sessionId) setRemoteSale(data)
    })
    events.onerror = () => setLiveStatus('offline')

    return () => events.close()
  }, [loadProducts, sessionId, setCart, setLiveStatus, setRemoteSale])

  const addProductToCart = useCallback((product: Product, options?: { name?: string; price?: number; forceNewLine?: boolean }) => {
    const linePrice = options?.price ?? product.salePrice
    const lineName = options?.name ?? product.name

    setCart((prev) => {
      const existing = options?.forceNewLine ? undefined : prev.find((item) => item.productId === product.id && item.price === linePrice)
      if (existing) {
        return prev.map((item) => item.id === existing.id ? { ...item, quantity: item.quantity + 1 } : item)
      }

      return [...prev, {
        id: newId('cart'),
        productId: product.id,
        barcode: product.barcode,
        name: lineName,
        price: linePrice,
        quantity: 1,
      }]
    })
  }, [setCart])

  const categories = useMemo(() => {
    const base = ['ขายดี', 'ของสด', 'ของชำ', 'เครื่องดื่ม']
    const fromProducts = products.map((product) => product.category).filter((value): value is string => Boolean(value))
    return Array.from(new Set([...base, ...fromProducts]))
  }, [products])

  const quickProducts = useMemo(() => {
    const stocked = products.filter((product) => product.stock > 0)
    const filtered = stocked.filter((product) => {
      const text = `${product.name} ${product.category ?? ''}`.toLowerCase()
      if (quickTab === 'ขายดี') return true
      if (quickTab === 'ของสด') return /เนื้อ|หมู|ไก่|สด|กก/.test(text)
      if (quickTab === 'ของชำ') return /ของชำ|ข้าว|ไข่|น้ำปลา|น้ำตาล|บะหมี่|ปลากระป๋อง/.test(text)
      if (quickTab === 'เครื่องดื่ม') return /เครื่องดื่ม|น้ำ|โค้ก|ชา|กาแฟ|นม/.test(text)
      return product.category === quickTab
    })

    return filtered.slice(0, 12)
  }, [products, quickTab])

  const searchedProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase()
    if (!query) return []

    return products
      .filter((product) => `${product.name} ${product.category ?? ''} ${product.barcode}`.toLowerCase().includes(query))
      .slice(0, 10)
  }, [products, productSearch])

  const weightedProducts = useMemo(() => {
    return products.filter((product) => {
      const text = `${product.name} ${product.category ?? ''}`
      return text.includes('เนื้อ') || text.includes('หมู') || text.includes('ไก่') || text.includes('กก')
    }).slice(0, 80)
  }, [products])

  const customerBalances = useMemo(() => {
    const balances = new Map<string, number>()
    for (const customer of customers) balances.set(customer.id, 0)
    for (const entry of debtEntries) {
      const current = balances.get(entry.customerId) ?? 0
      balances.set(entry.customerId, entry.type === 'sale' ? current + entry.amount : current - entry.amount)
    }
    return balances
  }, [customers, debtEntries])

  const selectedCustomerBalance = selectedCustomerId ? customerBalances.get(selectedCustomerId) ?? 0 : 0
  const totalDebt = Array.from(customerBalances.values()).reduce((sum, value) => sum + Math.max(0, value), 0)
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const paidAmount = Number(receivedAmount) || 0
  const changeAmount = Math.max(0, paidAmount - total)

  const todaySales = completedSales.filter((sale) => isToday(sale.createdAt))
  const todayCashSales = todaySales.filter((sale) => sale.paymentType === 'cash')
  const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0)
  const todayCash = todayCashSales.reduce((sum, sale) => sum + sale.paidAmount - sale.change, 0)
  const topTodayProduct = (() => {
    const counts = new Map<string, number>()
    for (const sale of todaySales) {
      for (const item of sale.items) counts.set(item.name, (counts.get(item.name) ?? 0) + item.quantity)
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]
  })()

  const rememberCompletedSale = (receipt: LastReceipt) => {
    setCompletedSales((prev) => {
      const next = [receipt, ...prev].slice(0, 200)
      writeStoredArray(completedSalesKey, next)
      return next
    })
  }

  const saveOfflineSale = (payload: SalePayload, receipt: LastReceipt) => {
    const offline: OfflineSale = { id: newId('offline'), payload, receipt, createdAt: new Date().toISOString() }
    setOfflineSales((prev) => {
      const next = [offline, ...prev]
      writeStoredArray(offlineSalesKey, next)
      return next
    })
  }

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      fetch('/api/realtime/current-sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'current-sale.updated',
          sessionId,
          items: cart.map((item) => ({
            productId: item.productId,
            barcode: item.barcode,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
          itemCount,
          total,
          createdAt: new Date().toISOString(),
        }),
        signal: controller.signal,
      }).catch(() => setLiveStatus('offline'))
    }, 200)

    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [cart, itemCount, sessionId, setLiveStatus, total])

  const postSale = async (payload: SalePayload) => {
    const res = await fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      let detail = ''
      try {
        const body = await res.json() as { error?: string }
        detail = body.error ? `: ${body.error}` : ''
      } catch {
        detail = ''
      }
      throw new Error(`sale failed (${res.status})${detail}`)
    }
    return res.json() as Promise<{ id: string; createdAt?: string; debtEntry?: DebtEntry | null }>
  }

  const postDebtEntry = async (entry: {
    customerId: string
    type: DebtEntry['type']
    amount: number
    note: string
    saleId?: string
  }) => {
    const res = await fetch('/api/debt/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    })
    if (!res.ok) throw new Error('debt entry failed')
    return res.json() as Promise<DebtEntry>
  }

  const showScanFeedback = useCallback((type: 'success' | 'info' | 'error', title: string, detail: string) => {
    setScanFeedback({ type, title, detail, createdAt: Date.now() })
    if (type === 'success') playScanBeep()
  }, [playScanBeep, setScanFeedback])

  const handleScan = useCallback(async (barcode: string) => {
    const normalizedBarcode = barcode.trim()
    if (!normalizedBarcode) return

    const cachedProduct = products.find((product) => product.barcode === normalizedBarcode)
    if (cachedProduct) {
      addProductToCart(cachedProduct)
      setNotification({ type: 'success', message: `${cachedProduct.name} ${t('pos.added')}` })
      showScanFeedback('success', cachedProduct.name, money.format(cachedProduct.salePrice))
      setBarcodeInput('')
      inputRef.current?.focus()
      return
    }

    setLoading(true)
    let timer: number | undefined
    try {
      const controller = new AbortController()
      timer = window.setTimeout(() => controller.abort(), 2500)
      const res = await fetch(`/api/products/${encodeURIComponent(normalizedBarcode)}`, { signal: controller.signal })
      const data = await res.json()

      if (res.ok && data.source === 'local') {
        addProductToCart(data.product)
        setNotification({ type: 'success', message: `${data.product.name} ${t('pos.added')}` })
        showScanFeedback('success', data.product.name, money.format(data.product.salePrice))
        setBarcodeInput('')
      } else {
        setNotification({ type: 'info', message: 'ไม่พบสินค้านี้ในสต็อกร้าน' })
        showScanFeedback('info', 'ไม่พบในสต็อก', normalizedBarcode)
      }
    } catch (error) {
      console.error('Scan error:', error)
      setNotification({ type: 'error', message: t('pos.serverError') })
      showScanFeedback('error', 'สแกนไม่สำเร็จ', normalizedBarcode)
    } finally {
      if (timer) window.clearTimeout(timer)
      setLoading(false)
    }
  }, [addProductToCart, products, setBarcodeInput, setLoading, setNotification, showScanFeedback, t])

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && barcodeInput) handleScan(barcodeInput)
  }

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) => prev.map((item) => {
      if (item.id !== id) return item
      const newQty = item.quantity + delta
      return newQty > 0 ? { ...item, quantity: newQty } : item
    }))
  }

  const addWeightedItem = () => {
    const product = products.find((item) => item.id === weightedProductId) ?? weightedProducts[0]
    const weight = Number(weightKg)
    if (!product || !Number.isFinite(weight) || weight <= 0) {
      setNotification({ type: 'error', message: 'เลือกสินค้าและใส่น้ำหนักให้ถูกต้อง' })
      return
    }

    const linePrice = Math.round(getUnitPricePerKg(product) * weight * 100) / 100
    addProductToCart(product, {
      name: `${product.name} x ${weight.toFixed(2)} กก.`,
      price: linePrice,
      forceNewLine: true,
    })
    setNotification({ type: 'success', message: `เพิ่ม ${product.name} ${weight.toFixed(2)} กก.` })
  }

  const holdCurrentBill = () => {
    if (cart.length === 0) return
    const held: HeldBill = {
      id: newId('hold'),
      label: `บิล ${heldBills.length + 1}`,
      items: cart,
      total,
      createdAt: new Date().toISOString(),
    }

    setHeldBills((prev) => {
      const next = [held, ...prev]
      writeStoredArray(heldBillsKey, next)
      return next
    })
    setCart([])
    setReceivedAmount('')
    setNotification({ type: 'success', message: 'พักบิลไว้แล้ว ขายคนถัดไปได้เลย' })
  }

  const restoreHeldBill = (bill: HeldBill) => {
    if (cart.length > 0) holdCurrentBill()
    setCart(bill.items)
    setHeldBills((prev) => {
      const next = prev.filter((item) => item.id !== bill.id)
      writeStoredArray(heldBillsKey, next)
      return next
    })
    setNotification({ type: 'info', message: `ดึง${bill.label}กลับมาแล้ว` })
  }

  const removeHeldBill = (id: string) => {
    setHeldBills((prev) => {
      const next = prev.filter((bill) => bill.id !== id)
      writeStoredArray(heldBillsKey, next)
      return next
    })
  }

  const completeCart = async (paymentType: LastReceipt['paymentType'], finalPaidAmount: number, finalChange: number, creditCustomerId?: string) => {
    const receiptItems = cart.map((item) => ({ name: item.name, quantity: item.quantity, price: item.price }))
    const payload = buildSalePayload(cart, total, finalPaidAmount, finalChange, {
      paymentType: paymentType === 'credit' ? 'credit' : 'cash',
      customerId: creditCustomerId,
    })
    const fallbackReceipt: LastReceipt = {
      id: newId(paymentType),
      items: receiptItems,
      total,
      paidAmount: finalPaidAmount,
      change: finalChange,
      createdAt: new Date().toISOString(),
      paymentType,
    }

    try {
      if (!navigator.onLine) throw new Error('offline')
      const sale = await postSale(payload)
      const receipt = { ...fallbackReceipt, id: sale.id, createdAt: sale.createdAt ?? fallbackReceipt.createdAt }

      if (paymentType === 'credit' && sale.debtEntry) {
        setDebtEntries((prev) => [sale.debtEntry as DebtEntry, ...prev])
      }

      setLastReceipt(receipt)
      rememberCompletedSale(receipt)
      if (paymentType !== 'credit') {
        setNotification({ type: 'success', message: `${t('pos.saleCompleted')}! ${money.format(total)}` })
      } else if (creditCustomerId) {
        setNotification({ type: 'success', message: 'บันทึกขายเชื่อแล้ว' })
      }
    } catch {
      saveOfflineSale(payload, fallbackReceipt)
      setLastReceipt(fallbackReceipt)
      rememberCompletedSale(fallbackReceipt)
      setLiveStatus('offline')
      setNotification({ type: 'info', message: 'เน็ตหลุด บันทึกบิลไว้ในเครื่องแล้ว รอ sync' })
    }

    setCart([])
    setReceivedAmount('')
  }

  const handleCheckout = async () => {
    if (cart.length === 0) return
    const finalPaidAmount = paidAmount > 0 ? paidAmount : total
    if (finalPaidAmount < total) {
      setNotification({ type: 'error', message: 'เงินที่รับมายังไม่พอ' })
      return
    }

    setLoading(true)
    await completeCart('cash', finalPaidAmount, finalPaidAmount - total)
    setLoading(false)
  }

  const addCustomer = async () => {
    const name = newCustomerName.trim()
    if (!name) return

    setLoading(true)
    try {
      const res = await fetch('/api/debt/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) throw new Error('customer failed')

      const customer = await res.json() as DebtCustomer
      setCustomers((prev) => [customer, ...prev])
      setSelectedCustomerId(customer.id)
      setNewCustomerName('')
      setNotification({ type: 'success', message: `เพิ่มลูกหนี้ ${name} แล้ว` })
    } catch {
      setNotification({ type: 'error', message: 'เพิ่มลูกหนี้ไม่สำเร็จ' })
    } finally {
      setLoading(false)
    }
  }

  const handleCreditSale = async () => {
    if (cart.length === 0) return
    if (!selectedCustomerId) {
      setNotification({ type: 'error', message: 'เลือกลูกค้าก่อนบันทึกขายเชื่อ' })
      return
    }

    setLoading(true)
    await completeCart('credit', 0, 0, selectedCustomerId)
    setLoading(false)
  }

  const recordDebtPayment = async () => {
    const amount = Number(debtPaymentAmount)
    if (!selectedCustomerId || !Number.isFinite(amount) || amount <= 0) {
      setNotification({ type: 'error', message: 'เลือกลูกค้าและใส่ยอดจ่ายให้ถูกต้อง' })
      return
    }

    setLoading(true)
    try {
      const entry = await postDebtEntry({
        customerId: selectedCustomerId,
        type: 'payment',
        amount,
        note: 'จ่ายบางส่วน',
      })
      setDebtEntries((prev) => [entry, ...prev])
      setDebtPaymentAmount('')
      setNotification({ type: 'success', message: `รับชำระ ${money.format(amount)} แล้ว` })
    } catch {
      setNotification({ type: 'error', message: 'บันทึกการชำระไม่สำเร็จ' })
    } finally {
      setLoading(false)
    }
  }

  const syncOfflineSales = useCallback(async () => {
    if (offlineSales.length === 0) return
    if (offlineSyncInFlightRef.current) return
    offlineSyncInFlightRef.current = true
    setLoading(true)
    const remaining: OfflineSale[] = []

    for (const sale of offlineSales) {
      try {
        await postSale(sale.payload)
      } catch (error) {
        console.warn('Offline sale sync failed:', error)
        remaining.push(sale)
      }
    }

    setOfflineSales(remaining)
    writeStoredArray(offlineSalesKey, remaining)
    setNotification({
      type: remaining.length === 0 ? 'success' : 'info',
      message: remaining.length === 0 ? 'Sync บิลค้างครบแล้ว' : `ยังเหลือบิลรอ sync ${remaining.length} บิล`,
    })
    offlineSyncInFlightRef.current = false
    setLoading(false)
    loadProducts()
  }, [loadProducts, offlineSales, setLoading, setNotification, setOfflineSales])

  useEffect(() => {
    if (liveStatus !== 'live') return
    if (offlineSales.length === 0) return
    void syncOfflineSales()
  }, [liveStatus, offlineSales.length, syncOfflineSales])

  const saveQuickProduct = async () => {
    const name = quickProductName.trim()
    const price = Number(quickProductPrice)
    if (!name || !Number.isFinite(price) || price <= 0) {
      setNotification({ type: 'error', message: 'ใส่ชื่อสินค้าและราคาให้ถูกต้อง' })
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barcode: `QB${Date.now()}`,
          name,
          category: quickProductCategory,
          salePrice: price,
          costPrice: 0,
          stock: 10,
          lowStockAlert: 2,
        }),
      })
      if (!res.ok) throw new Error('quick product failed')
      const product = await res.json() as Product
      setProducts((prev) => [product, ...prev])
      addProductToCart(product)
      setQuickProductName('')
      setQuickProductPrice('')
      setNotification({ type: 'success', message: 'เพิ่มสินค้าเร็วและใส่ตะกร้าแล้ว' })
    } catch {
      setNotification({ type: 'error', message: 'บันทึกสินค้าเร็วไม่สำเร็จ' })
    } finally {
      setLoading(false)
    }
  }

  const printReceipt = () => {
    if (!lastReceipt) return

    const receiptRows = lastReceipt.items.map((item) => `
      <tr>
        <td>${escapeReceiptText(item.name)}</td>
        <td style="text-align:center;">${item.quantity}</td>
        <td style="text-align:right;">${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('')

    const receiptWindow = window.open('', 'swift-pos-receipt', 'width=380,height=640')
    if (!receiptWindow) {
      setNotification({ type: 'error', message: 'เปิดหน้าพิมพ์ใบเสร็จไม่ได้' })
      return
    }

    receiptWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Swift POS Receipt</title>
          <style>
            @page { size: 58mm auto; margin: 4mm; }
            body { width: 58mm; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; color: #111827; margin: 0; padding: 0; }
            h1 { font-size: 16px; margin: 0 0 4px; text-align: center; }
            p { margin: 0; font-size: 10px; text-align: center; color: #4b5563; }
            .line { border-top: 1px dashed #111827; margin: 10px 0; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            td { padding: 3px 0; vertical-align: top; }
            .summary { display: grid; gap: 4px; font-size: 12px; }
            .summary div { display: flex; justify-content: space-between; }
            .total { font-weight: 800; font-size: 14px; }
          </style>
        </head>
        <body>
          <h1>Swift POS</h1>
          <p>${new Date(lastReceipt.createdAt).toLocaleString('th-TH')}</p>
          <p>Receipt ${escapeReceiptText(lastReceipt.id)}</p>
          <div class="line"></div>
          <table><tbody>${receiptRows}</tbody></table>
          <div class="line"></div>
          <div class="summary">
            <div class="total"><span>รวม</span><span>${money.format(lastReceipt.total)}</span></div>
            <div><span>รับมา</span><span>${money.format(lastReceipt.paidAmount)}</span></div>
            <div><span>ทอน</span><span>${money.format(lastReceipt.change)}</span></div>
          </div>
        </body>
      </html>
    `)
    receiptWindow.document.close()
    receiptWindow.focus()
    receiptWindow.print()
  }

  return {
    shellClassName: `pos-shell ${seniorMode ? 'senior-pos' : ''}`,
    toastProps: {
      notification,
      onClose: () => setNotification(null),
    },
    mainColumnProps: {
      activeTool,
      seniorMode,
      loading,
      showCamera,
      scanFeedback,
      barcodeInput,
      productSearch,
      quickTab,
      weightedProductId,
      weightKg,
      quickProductName,
      quickProductPrice,
      quickProductCategory,
      categories,
      quickProducts,
      searchedProducts,
      weightedProducts,
      cart,
      customers,
      selectedCustomerId,
      selectedCustomerBalance,
      totalDebt,
      customerBalances,
      newCustomerName,
      debtPaymentAmount,
      inputRef,
      t,
      onToggleSeniorMode: () => setSeniorMode((prev) => !prev),
      onToggleCamera: () => setShowCamera((prev) => !prev),
      onBarcodeInputChange: setBarcodeInput,
      onBarcodeKeyDown: handleKeyDown,
      onProductSearchChange: setProductSearch,
      onQuickTabChange: setQuickTab,
      onAddProductToCart: addProductToCart,
      onScan: handleScan,
      onWeightedProductChange: setWeightedProductId,
      onWeightKgChange: setWeightKg,
      onAddWeightedItem: addWeightedItem,
      onQuickProductNameChange: setQuickProductName,
      onQuickProductPriceChange: setQuickProductPrice,
      onQuickProductCategoryChange: setQuickProductCategory,
      onSaveQuickProduct: saveQuickProduct,
      onSelectedCustomerChange: setSelectedCustomerId,
      onNewCustomerNameChange: setNewCustomerName,
      onAddCustomer: addCustomer,
      onDebtPaymentAmountChange: setDebtPaymentAmount,
      onRecordDebtPayment: recordDebtPayment,
      onCreditSale: handleCreditSale,
    },
    sideColumnProps: {
      cart,
      itemCount,
      total,
      paidAmount,
      changeAmount,
      liveStatus,
      remoteSale,
      receivedAmount,
      lastReceipt,
      heldBills,
      todayRevenue,
      todayCash,
      todaySalesCount: todaySales.length,
      topTodayProduct,
      offlineSales,
      loading,
      t,
      onUpdateQuantity: updateQuantity,
      onRemoveCartItem: (id: string) => setCart((prev) => prev.filter((line) => line.id !== id)),
      onHoldCurrentBill: holdCurrentBill,
      onClearCart: () => setCart([]),
      onReceivedAmountChange: setReceivedAmount,
      onPrintReceipt: printReceipt,
      onDismissReceipt: () => setLastReceipt(null),
      onCheckout: handleCheckout,
      onRestoreHeldBill: restoreHeldBill,
      onRemoveHeldBill: removeHeldBill,
      onSyncOfflineSales: syncOfflineSales,
    },
  }
}
