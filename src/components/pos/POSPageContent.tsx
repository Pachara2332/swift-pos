'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PosMainColumn from '@/components/pos/PosMainColumn';
import PosSideColumn from '@/components/pos/PosSideColumn';
import PosToast from '@/components/pos/PosToast';
import { useI18n } from '@/lib/i18n';
import {
  completedSalesKey,
  customersKey,
  debtEntriesKey,
  heldBillsKey,
  offlineSalesKey,
  readStoredArray,
  writeStoredArray,
} from '@/lib/pos/storage';
import type {
  CartItem,
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
} from '@/lib/pos/types';
import { buildSalePayload, escapeReceiptText, getUnitPricePerKg, isToday, money, newId } from '@/lib/pos/utils';

const posTools: PosTool[] = ['sale', 'weight', 'quick-product', 'debt'];

function parsePosTool(value: string | null): PosTool {
  return value && posTools.includes(value as PosTool) ? value as PosTool : 'sale';
}

export default function POSPageContent() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const activeTool = parsePosTool(searchParams.get('tool'));
  const [seniorMode, setSeniorMode] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [quickTab, setQuickTab] = useState('ขายดี');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [heldBills, setHeldBills] = useState<HeldBill[]>(() => readStoredArray<HeldBill>(heldBillsKey));
  const [customers, setCustomers] = useState<DebtCustomer[]>(() => readStoredArray<DebtCustomer>(customersKey));
  const [debtEntries, setDebtEntries] = useState<DebtEntry[]>(() => readStoredArray<DebtEntry>(debtEntriesKey));
  const [offlineSales, setOfflineSales] = useState<OfflineSale[]>(() => readStoredArray<OfflineSale>(offlineSalesKey));
  const [completedSales, setCompletedSales] = useState<LastReceipt[]>(() => readStoredArray<LastReceipt>(completedSalesKey));
  const [showCamera, setShowCamera] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);
  const [lastReceipt, setLastReceipt] = useState<LastReceipt | null>(null);
  const [liveStatus, setLiveStatus] = useState<'connecting' | 'live' | 'offline'>('connecting');
  const [remoteSale, setRemoteSale] = useState<CurrentSaleEvent | null>(null);
  const [weightedProductId, setWeightedProductId] = useState('');
  const [weightKg, setWeightKg] = useState('0.5');
  const [receivedAmount, setReceivedAmount] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [debtPaymentAmount, setDebtPaymentAmount] = useState('');
  const [quickProductName, setQuickProductName] = useState('');
  const [quickProductPrice, setQuickProductPrice] = useState('');
  const [quickProductCategory, setQuickProductCategory] = useState('ของชำ');
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionId = `pos-${useId()}`;

  useEffect(() => {
    if (!showCamera) inputRef.current?.focus();
  }, [showCamera]);

  const loadProducts = useCallback(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(() => setProducts([]));
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    const initialStatus = window.setTimeout(() => {
      if (!navigator.onLine) setLiveStatus('offline');
    }, 0);

    const markOnline = () => setLiveStatus('connecting');
    const markOffline = () => setLiveStatus('offline');
    window.addEventListener('online', markOnline);
    window.addEventListener('offline', markOffline);
    return () => {
      window.clearTimeout(initialStatus);
      window.removeEventListener('online', markOnline);
      window.removeEventListener('offline', markOffline);
    };
  }, []);

  useEffect(() => {
    if (!notification) return;

    const timer = window.setTimeout(() => setNotification(null), 3000);
    return () => window.clearTimeout(timer);
  }, [notification]);

  useEffect(() => {
    if (!sessionId) return;

    const events = new EventSource('/api/realtime');

    events.addEventListener('connected', () => setLiveStatus(navigator.onLine ? 'live' : 'offline'));
    events.addEventListener('product.changed', (event) => {
      const data = JSON.parse(event.data) as ProductChangedEvent;
      loadProducts();
      setCart((prev) => prev.map((item) => {
        if (item.productId !== data.product.id && item.barcode !== data.product.barcode) return item;
        return { ...item, name: data.product.name, price: data.product.salePrice };
      }));
    });
    events.addEventListener('current-sale.updated', (event) => {
      const data = JSON.parse(event.data) as CurrentSaleEvent;
      if (data.sessionId !== sessionId) setRemoteSale(data);
    });
    events.onerror = () => setLiveStatus('offline');

    return () => events.close();
  }, [loadProducts, sessionId]);

  const addProductToCart = useCallback((product: Product, options?: { name?: string; price?: number; forceNewLine?: boolean }) => {
    const linePrice = options?.price ?? product.salePrice;
    const lineName = options?.name ?? product.name;

    setCart((prev) => {
      const existing = options?.forceNewLine ? undefined : prev.find((item) => item.productId === product.id && item.price === linePrice);
      if (existing) {
        return prev.map((item) => item.id === existing.id ? { ...item, quantity: item.quantity + 1 } : item);
      }

      return [...prev, {
        id: newId('cart'),
        productId: product.id,
        barcode: product.barcode,
        name: lineName,
        price: linePrice,
        quantity: 1,
      }];
    });
  }, []);

  const categories = useMemo(() => {
    const base = ['ขายดี', 'ของสด', 'ของชำ', 'เครื่องดื่ม'];
    const fromProducts = products.map((product) => product.category).filter((value): value is string => Boolean(value));
    return Array.from(new Set([...base, ...fromProducts]));
  }, [products]);

  const quickProducts = useMemo(() => {
    const stocked = products.filter((product) => product.stock > 0);
    const filtered = stocked.filter((product) => {
      const text = `${product.name} ${product.category ?? ''}`.toLowerCase();
      if (quickTab === 'ขายดี') return true;
      if (quickTab === 'ของสด') return /เนื้อ|หมู|ไก่|สด|กก/.test(text);
      if (quickTab === 'ของชำ') return /ของชำ|ข้าว|ไข่|น้ำปลา|น้ำตาล|บะหมี่|ปลากระป๋อง/.test(text);
      if (quickTab === 'เครื่องดื่ม') return /เครื่องดื่ม|น้ำ|โค้ก|ชา|กาแฟ|นม/.test(text);
      return product.category === quickTab;
    });

    return filtered.slice(0, 12);
  }, [products, quickTab]);

  const searchedProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();
    if (!query) return [];

    return products
      .filter((product) => `${product.name} ${product.category ?? ''} ${product.barcode}`.toLowerCase().includes(query))
      .slice(0, 10);
  }, [products, productSearch]);

  const weightedProducts = useMemo(() => {
    return products.filter((product) => {
      const text = `${product.name} ${product.category ?? ''}`;
      return text.includes('เนื้อ') || text.includes('หมู') || text.includes('ไก่') || text.includes('กก');
    }).slice(0, 80);
  }, [products]);

  const customerBalances = useMemo(() => {
    const balances = new Map<string, number>();
    for (const customer of customers) balances.set(customer.id, 0);
    for (const entry of debtEntries) {
      const current = balances.get(entry.customerId) ?? 0;
      balances.set(entry.customerId, entry.type === 'sale' ? current + entry.amount : current - entry.amount);
    }
    return balances;
  }, [customers, debtEntries]);

  const selectedCustomerBalance = selectedCustomerId ? customerBalances.get(selectedCustomerId) ?? 0 : 0;
  const totalDebt = Array.from(customerBalances.values()).reduce((sum, value) => sum + Math.max(0, value), 0);

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const paidAmount = Number(receivedAmount) || 0;
  const changeAmount = Math.max(0, paidAmount - total);

  const todaySales = completedSales.filter((sale) => isToday(sale.createdAt));
  const todayCashSales = todaySales.filter((sale) => sale.paymentType === 'cash');
  const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);
  const todayCash = todayCashSales.reduce((sum, sale) => sum + sale.paidAmount - sale.change, 0);
  const topTodayProduct = (() => {
    const counts = new Map<string, number>();
    for (const sale of todaySales) {
      for (const item of sale.items) counts.set(item.name, (counts.get(item.name) ?? 0) + item.quantity);
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0];
  })();

  const rememberCompletedSale = (receipt: LastReceipt) => {
    setCompletedSales((prev) => {
      const next = [receipt, ...prev].slice(0, 200);
      writeStoredArray(completedSalesKey, next);
      return next;
    });
  };

  const saveOfflineSale = (payload: SalePayload, receipt: LastReceipt) => {
    const offline: OfflineSale = { id: newId('offline'), payload, receipt, createdAt: new Date().toISOString() };
    setOfflineSales((prev) => {
      const next = [offline, ...prev];
      writeStoredArray(offlineSalesKey, next);
      return next;
    });
  };

  useEffect(() => {
    if (!sessionId) return;

    const controller = new AbortController();
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
      }).catch(() => setLiveStatus('offline'));
    }, 200);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [cart, itemCount, sessionId, total]);

  const postSale = async (payload: SalePayload) => {
    const res = await fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('sale failed');
    return res.json() as Promise<{ id: string; createdAt?: string }>;
  };

  const handleScan = useCallback(async (barcode: string) => {
    if (!barcode.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${barcode}`);
      const data = await res.json();

      if (res.ok && data.source === 'local') {
        addProductToCart(data.product);
        setNotification({ type: 'success', message: `${data.product.name} ${t('pos.added')}` });
        setBarcodeInput('');
        if (showCamera) setShowCamera(false);
      } else {
        const params = new URLSearchParams({ barcode });
        if (data.source === 'external') {
          params.append('name', data.product.name);
          params.append('brand', data.product.brand);
          params.append('imageUrl', data.product.imageUrl);
          setNotification({ type: 'info', message: t('pos.externalFound') });
        } else {
          setNotification({ type: 'info', message: t('pos.notFound') });
        }
        setTimeout(() => router.push(`/products/add?${params.toString()}`), 800);
      }
    } catch (error) {
      console.error('Scan error:', error);
      setNotification({ type: 'error', message: t('pos.serverError') });
    } finally {
      setLoading(false);
    }
  }, [addProductToCart, router, showCamera, t]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && barcodeInput) handleScan(barcodeInput);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) => prev.map((item) => {
      if (item.id !== id) return item;
      const newQty = item.quantity + delta;
      return newQty > 0 ? { ...item, quantity: newQty } : item;
    }));
  };

  const addWeightedItem = () => {
    const product = products.find((item) => item.id === weightedProductId) ?? weightedProducts[0];
    const weight = Number(weightKg);
    if (!product || !Number.isFinite(weight) || weight <= 0) {
      setNotification({ type: 'error', message: 'เลือกสินค้าและใส่น้ำหนักให้ถูกต้อง' });
      return;
    }

    const linePrice = Math.round(getUnitPricePerKg(product) * weight * 100) / 100;
    addProductToCart(product, {
      name: `${product.name} x ${weight.toFixed(2)} กก.`,
      price: linePrice,
      forceNewLine: true,
    });
    setNotification({ type: 'success', message: `เพิ่ม ${product.name} ${weight.toFixed(2)} กก.` });
  };

  const holdCurrentBill = () => {
    if (cart.length === 0) return;
    const held: HeldBill = {
      id: newId('hold'),
      label: `บิล ${heldBills.length + 1}`,
      items: cart,
      total,
      createdAt: new Date().toISOString(),
    };

    setHeldBills((prev) => {
      const next = [held, ...prev];
      writeStoredArray(heldBillsKey, next);
      return next;
    });
    setCart([]);
    setReceivedAmount('');
    setNotification({ type: 'success', message: 'พักบิลไว้แล้ว ขายคนถัดไปได้เลย' });
  };

  const restoreHeldBill = (bill: HeldBill) => {
    if (cart.length > 0) holdCurrentBill();
    setCart(bill.items);
    setHeldBills((prev) => {
      const next = prev.filter((item) => item.id !== bill.id);
      writeStoredArray(heldBillsKey, next);
      return next;
    });
    setNotification({ type: 'info', message: `ดึง${bill.label}กลับมาแล้ว` });
  };

  const removeHeldBill = (id: string) => {
    setHeldBills((prev) => {
      const next = prev.filter((bill) => bill.id !== id);
      writeStoredArray(heldBillsKey, next);
      return next;
    });
  };

  const completeCart = async (paymentType: LastReceipt['paymentType'], finalPaidAmount: number, finalChange: number, creditCustomerId?: string) => {
    const receiptItems = cart.map((item) => ({ name: item.name, quantity: item.quantity, price: item.price }));
    const payload = buildSalePayload(cart, total, finalPaidAmount, finalChange);
    const fallbackReceipt: LastReceipt = {
      id: newId(paymentType),
      items: receiptItems,
      total,
      paidAmount: finalPaidAmount,
      change: finalChange,
      createdAt: new Date().toISOString(),
      paymentType,
    };

    try {
      if (!navigator.onLine) throw new Error('offline');
      const sale = await postSale(payload);
      const receipt = { ...fallbackReceipt, id: sale.id, createdAt: sale.createdAt ?? fallbackReceipt.createdAt };
      setLastReceipt(receipt);
      rememberCompletedSale(receipt);
      setNotification({ type: 'success', message: paymentType === 'credit' ? 'บันทึกขายเชื่อแล้ว' : `${t('pos.saleCompleted')}! ${money.format(total)}` });
    } catch {
      saveOfflineSale(payload, fallbackReceipt);
      setLastReceipt(fallbackReceipt);
      rememberCompletedSale(fallbackReceipt);
      setLiveStatus('offline');
      setNotification({ type: 'info', message: 'เน็ตหลุด บันทึกบิลไว้ในเครื่องแล้ว รอ sync' });
    }

    if (paymentType === 'credit' && creditCustomerId) {
      const debt: DebtEntry = {
        id: newId('debt'),
        customerId: creditCustomerId,
        type: 'sale',
        amount: total,
        note: `ขายเชื่อ ${receiptItems.length} รายการ`,
        createdAt: new Date().toISOString(),
      };
      setDebtEntries((prev) => {
        const next = [debt, ...prev];
        writeStoredArray(debtEntriesKey, next);
        return next;
      });
    }

    setCart([]);
    setReceivedAmount('');
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    const finalPaidAmount = paidAmount > 0 ? paidAmount : total;
    if (finalPaidAmount < total) {
      setNotification({ type: 'error', message: 'เงินที่รับมายังไม่พอ' });
      return;
    }

    setLoading(true);
    await completeCart('cash', finalPaidAmount, finalPaidAmount - total);
    setLoading(false);
  };

  const addCustomer = () => {
    const name = newCustomerName.trim();
    if (!name) return;

    const customer: DebtCustomer = { id: newId('customer'), name, createdAt: new Date().toISOString() };
    setCustomers((prev) => {
      const next = [customer, ...prev];
      writeStoredArray(customersKey, next);
      return next;
    });
    setSelectedCustomerId(customer.id);
    setNewCustomerName('');
    setNotification({ type: 'success', message: `เพิ่มลูกหนี้ ${name} แล้ว` });
  };

  const handleCreditSale = async () => {
    if (cart.length === 0) return;
    if (!selectedCustomerId) {
      setNotification({ type: 'error', message: 'เลือกลูกค้าก่อนบันทึกขายเชื่อ' });
      return;
    }

    setLoading(true);
    await completeCart('credit', 0, 0, selectedCustomerId);
    setLoading(false);
  };

  const recordDebtPayment = () => {
    const amount = Number(debtPaymentAmount);
    if (!selectedCustomerId || !Number.isFinite(amount) || amount <= 0) {
      setNotification({ type: 'error', message: 'เลือกลูกค้าและใส่ยอดจ่ายให้ถูกต้อง' });
      return;
    }

    const entry: DebtEntry = {
      id: newId('payment'),
      customerId: selectedCustomerId,
      type: 'payment',
      amount,
      note: 'จ่ายบางส่วน',
      createdAt: new Date().toISOString(),
    };
    setDebtEntries((prev) => {
      const next = [entry, ...prev];
      writeStoredArray(debtEntriesKey, next);
      return next;
    });
    setDebtPaymentAmount('');
    setNotification({ type: 'success', message: `รับชำระ ${money.format(amount)} แล้ว` });
  };

  const syncOfflineSales = async () => {
    if (offlineSales.length === 0) return;
    setLoading(true);
    const remaining: OfflineSale[] = [];

    for (const sale of offlineSales) {
      try {
        await postSale(sale.payload);
      } catch {
        remaining.push(sale);
      }
    }

    setOfflineSales(remaining);
    writeStoredArray(offlineSalesKey, remaining);
    setNotification({
      type: remaining.length === 0 ? 'success' : 'info',
      message: remaining.length === 0 ? 'Sync บิลค้างครบแล้ว' : `ยังเหลือบิลรอ sync ${remaining.length} บิล`,
    });
    setLoading(false);
    loadProducts();
  };

  const saveQuickProduct = async () => {
    const name = quickProductName.trim();
    const price = Number(quickProductPrice);
    if (!name || !Number.isFinite(price) || price <= 0) {
      setNotification({ type: 'error', message: 'ใส่ชื่อสินค้าและราคาให้ถูกต้อง' });
      return;
    }

    setLoading(true);
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
      });
      if (!res.ok) throw new Error('quick product failed');
      const product = await res.json() as Product;
      setProducts((prev) => [product, ...prev]);
      addProductToCart(product);
      setQuickProductName('');
      setQuickProductPrice('');
      setNotification({ type: 'success', message: 'เพิ่มสินค้าเร็วและใส่ตะกร้าแล้ว' });
    } catch {
      setNotification({ type: 'error', message: 'บันทึกสินค้าเร็วไม่สำเร็จ' });
    } finally {
      setLoading(false);
    }
  };

  const printReceipt = () => {
    if (!lastReceipt) return;

    const receiptRows = lastReceipt.items.map((item) => `
      <tr>
        <td>${escapeReceiptText(item.name)}</td>
        <td style="text-align:center;">${item.quantity}</td>
        <td style="text-align:right;">${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    const receiptWindow = window.open('', 'swift-pos-receipt', 'width=380,height=640');
    if (!receiptWindow) {
      setNotification({ type: 'error', message: 'เปิดหน้าพิมพ์ใบเสร็จไม่ได้' });
      return;
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
    `);
    receiptWindow.document.close();
    receiptWindow.focus();
    receiptWindow.print();
  };

  return (
    <div className={`pos-shell ${seniorMode ? 'senior-pos' : ''}`}>
      <PosToast notification={notification} onClose={() => setNotification(null)} />

      <PosMainColumn
        activeTool={activeTool}
        seniorMode={seniorMode}
        loading={loading}
        showCamera={showCamera}
        barcodeInput={barcodeInput}
        productSearch={productSearch}
        quickTab={quickTab}
        weightedProductId={weightedProductId}
        weightKg={weightKg}
        quickProductName={quickProductName}
        quickProductPrice={quickProductPrice}
        quickProductCategory={quickProductCategory}
        categories={categories}
        quickProducts={quickProducts}
        searchedProducts={searchedProducts}
        weightedProducts={weightedProducts}
        cart={cart}
        customers={customers}
        selectedCustomerId={selectedCustomerId}
        selectedCustomerBalance={selectedCustomerBalance}
        totalDebt={totalDebt}
        customerBalances={customerBalances}
        newCustomerName={newCustomerName}
        debtPaymentAmount={debtPaymentAmount}
        inputRef={inputRef}
        t={t}
        onToggleSeniorMode={() => setSeniorMode((prev) => !prev)}
        onToggleCamera={() => setShowCamera((prev) => !prev)}
        onBarcodeInputChange={setBarcodeInput}
        onBarcodeKeyDown={handleKeyDown}
        onProductSearchChange={setProductSearch}
        onQuickTabChange={setQuickTab}
        onAddProductToCart={addProductToCart}
        onScan={handleScan}
        onWeightedProductChange={setWeightedProductId}
        onWeightKgChange={setWeightKg}
        onAddWeightedItem={addWeightedItem}
        onQuickProductNameChange={setQuickProductName}
        onQuickProductPriceChange={setQuickProductPrice}
        onQuickProductCategoryChange={setQuickProductCategory}
        onSaveQuickProduct={saveQuickProduct}
        onSelectedCustomerChange={setSelectedCustomerId}
        onNewCustomerNameChange={setNewCustomerName}
        onAddCustomer={addCustomer}
        onDebtPaymentAmountChange={setDebtPaymentAmount}
        onRecordDebtPayment={recordDebtPayment}
        onCreditSale={handleCreditSale}
      />

      <PosSideColumn
        cart={cart}
        itemCount={itemCount}
        total={total}
        paidAmount={paidAmount}
        changeAmount={changeAmount}
        liveStatus={liveStatus}
        remoteSale={remoteSale}
        receivedAmount={receivedAmount}
        lastReceipt={lastReceipt}
        heldBills={heldBills}
        todayRevenue={todayRevenue}
        todayCash={todayCash}
        todaySalesCount={todaySales.length}
        topTodayProduct={topTodayProduct}
        offlineSales={offlineSales}
        loading={loading}
        t={t}
        onUpdateQuantity={updateQuantity}
        onRemoveCartItem={(id) => setCart((prev) => prev.filter((line) => line.id !== id))}
        onHoldCurrentBill={holdCurrentBill}
        onClearCart={() => setCart([])}
        onReceivedAmountChange={setReceivedAmount}
        onPrintReceipt={printReceipt}
        onDismissReceipt={() => setLastReceipt(null)}
        onCheckout={handleCheckout}
        onRestoreHeldBill={restoreHeldBill}
        onRemoveHeldBill={removeHeldBill}
        onSyncOfflineSales={syncOfflineSales}
      />
    </div>
  );
}
