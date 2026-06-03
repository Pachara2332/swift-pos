'use client';
import { useState, useEffect, useRef, useCallback, useId } from 'react';
import { useRouter } from 'next/navigation';
import BarcodeScanner from '@/components/BarcodeScanner';
import { Camera, Search, ShoppingBag, Trash2, CreditCard, ScanLine, Plus, Minus, X, Printer, Radio } from 'lucide-react';

type CartItem = {
  id: string;
  productId: string;
  barcode: string;
  name: string;
  price: number;
  quantity: number;
};

type ReceiptItem = {
  name: string;
  quantity: number;
  price: number;
};

type LastReceipt = {
  id: string;
  items: ReceiptItem[];
  total: number;
  paidAmount: number;
  change: number;
  createdAt: string;
};

type ProductChangedEvent = {
  type: 'product.changed';
  product: {
    id: string;
    barcode: string;
    name: string;
    salePrice: number;
  };
};

type CurrentSaleEvent = {
  type: 'current-sale.updated';
  sessionId: string;
  items: {
    productId: string;
    barcode: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  itemCount: number;
  total: number;
  createdAt: string;
};

function escapeReceiptText(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default function POSPage() {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);
  const [lastReceipt, setLastReceipt] = useState<LastReceipt | null>(null);
  const [liveStatus, setLiveStatus] = useState<'connecting' | 'live' | 'offline'>('connecting');
  const [remoteSale, setRemoteSale] = useState<CurrentSaleEvent | null>(null);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionId = `pos-${useId()}`;

  useEffect(() => {
    if (!showCamera) {
      inputRef.current?.focus();
    }
  }, [showCamera]);

  // Auto-dismiss notification
  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(t);
    }
  }, [notification]);

  useEffect(() => {
    if (!sessionId) return;

    const events = new EventSource('/api/realtime');

    events.addEventListener('connected', () => setLiveStatus('live'));
    events.addEventListener('product.changed', (event) => {
      const data = JSON.parse(event.data) as ProductChangedEvent;
      setCart(prev => prev.map(item => {
        if (item.productId !== data.product.id && item.barcode !== data.product.barcode) return item;
        return {
          ...item,
          name: data.product.name,
          price: data.product.salePrice,
        };
      }));
    });
    events.addEventListener('current-sale.updated', (event) => {
      const data = JSON.parse(event.data) as CurrentSaleEvent;
      if (data.sessionId !== sessionId) {
        setRemoteSale(data);
      }
    });
    events.onerror = () => setLiveStatus('offline');

    return () => events.close();
  }, [sessionId]);

  const handleScan = useCallback(async (barcode: string) => {
    if (!barcode.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${barcode}`);
      const data = await res.json();

      if (res.ok && data.source === 'local') {
        setCart(prev => {
          const existing = prev.find(item => item.barcode === barcode);
          if (existing) {
            return prev.map(item => item.barcode === barcode ? { ...item, quantity: item.quantity + 1 } : item);
          }
          return [...prev, {
            id: Math.random().toString(36),
            productId: data.product.id,
            barcode: data.product.barcode,
            name: data.product.name,
            price: data.product.salePrice,
            quantity: 1
          }];
        });
        setNotification({ type: 'success', message: `✓ ${data.product.name} added to cart` });
        setBarcodeInput('');
        if (showCamera) setShowCamera(false);
      } else {
        const params = new URLSearchParams({ barcode });
        if (data.source === 'external') {
          params.append('name', data.product.name);
          params.append('brand', data.product.brand);
          params.append('imageUrl', data.product.imageUrl);
          setNotification({ type: 'info', message: `Product found online — redirecting to add...` });
        } else {
          setNotification({ type: 'info', message: `Product not found — redirecting to add...` });
        }
        setTimeout(() => router.push(`/products/add?${params.toString()}`), 800);
      }
    } catch (error) {
      console.error('Scan error:', error);
      setNotification({ type: 'error', message: 'Error connecting to server' });
    } finally {
      setLoading(false);
    }
  }, [router, showCamera]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && barcodeInput) {
      handleScan(barcodeInput);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

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
          items: cart.map(item => ({
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
      }).catch(() => {
        setLiveStatus('offline');
      });
    }, 200);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [cart, itemCount, sessionId, total]);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    const receiptItems = cart.map(item => ({ name: item.name, quantity: item.quantity, price: item.price }));
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          total,
          paidAmount: total,
          change: 0,
          items: cart.map(item => ({ productId: item.productId, quantity: item.quantity, price: item.price }))
        })
      });
      if (res.ok) {
        const sale = await res.json();
        setLastReceipt({
          id: sale.id,
          items: receiptItems,
          total,
          paidAmount: total,
          change: 0,
          createdAt: sale.createdAt ?? new Date().toISOString(),
        });
        setNotification({ type: 'success', message: `Sale completed! ฿${total.toFixed(2)}` });
        setCart([]);
      } else {
        setNotification({ type: 'error', message: 'Checkout failed' });
      }
    } catch {
      setNotification({ type: 'error', message: 'Checkout error' });
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
      setNotification({ type: 'error', message: 'Unable to open receipt window' });
      return;
    }

    receiptWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Swift POS Receipt</title>
          <style>
            body { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; color: #111827; margin: 0; padding: 20px; }
            h1 { font-size: 20px; margin: 0 0 4px; text-align: center; }
            p { margin: 0; font-size: 12px; text-align: center; color: #4b5563; }
            .line { border-top: 1px dashed #111827; margin: 14px 0; }
            table { width: 100%; border-collapse: collapse; font-size: 13px; }
            td { padding: 4px 0; vertical-align: top; }
            .summary { display: grid; gap: 6px; font-size: 14px; }
            .summary div { display: flex; justify-content: space-between; }
            .total { font-weight: 800; font-size: 16px; }
          </style>
        </head>
        <body>
          <h1>Swift POS</h1>
          <p>${new Date(lastReceipt.createdAt).toLocaleString()}</p>
          <p>Receipt ${escapeReceiptText(lastReceipt.id)}</p>
          <div class="line"></div>
          <table>
            <tbody>${receiptRows}</tbody>
          </table>
          <div class="line"></div>
          <div class="summary">
            <div class="total"><span>Total</span><span>THB ${lastReceipt.total.toFixed(2)}</span></div>
            <div><span>Cash</span><span>THB ${lastReceipt.paidAmount.toFixed(2)}</span></div>
            <div><span>Change</span><span>THB ${lastReceipt.change.toFixed(2)}</span></div>
          </div>
        </body>
      </html>
    `);
    receiptWindow.document.close();
    receiptWindow.focus();
    receiptWindow.print();
  };

  return (
    <div className="pos-shell">
      {/* Notification Toast */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '1.5rem',
          right: '1.5rem',
          zIndex: 100,
          padding: '0.875rem 1.25rem',
          borderRadius: 'var(--radius-sm)',
          color: '#fff',
          fontWeight: 500,
          fontSize: '0.875rem',
          animation: 'slideInRight 0.3s ease-out',
          background: notification.type === 'success' ? 'var(--success)' : notification.type === 'error' ? 'var(--danger)' : 'var(--primary)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          {notification.message}
          <button onClick={() => setNotification(null)} style={{ color: 'rgba(255,255,255,0.7)' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Left: Scanner */}
      <div className="pos-scanner-column">
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Point of Sale</h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Scan or type a barcode to start selling</p>
        </div>

        <div className="card" style={{ animation: 'fadeIn 0.3s ease-out' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--primary)', fontWeight: 600 }}>
            <ScanLine size={18} />
            <span>Barcode Scanner</span>
          </div>
          
          <div className="scanner-controls">
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
              <input 
                ref={inputRef}
                type="text" 
                className="input-field" 
                placeholder="Scan barcode or type and press Enter..." 
                style={{ width: '100%', fontSize: '1.1rem', padding: '0.875rem 0.875rem 0.875rem 2.75rem' }}
                value={barcodeInput}
                onChange={e => setBarcodeInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                autoFocus
              />
            </div>
            <button 
              className="btn btn-primary" 
              onClick={() => setShowCamera(!showCamera)}
              style={{ whiteSpace: 'nowrap' }}
            >
              <Camera size={18} />
              {showCamera ? 'Close' : 'Camera'}
            </button>
          </div>
          
          {loading && (
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted)', fontSize: '0.875rem' }}>
              <div style={{ width: '14px', height: '14px', border: '2px solid var(--border)', borderTop: '2px solid var(--primary)', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }}></div>
              Processing...
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}
        </div>

        {showCamera && (
          <div className="card" style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <BarcodeScanner onScan={handleScan} />
          </div>
        )}
      </div>

      {/* Right: Cart */}
      <div className="card pos-cart">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingBag size={18} />
            Current Sale
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <span className={`live-pill live-pill-${liveStatus}`}>
              <Radio size={13} />
              {liveStatus === 'live' ? 'Live sale' : liveStatus === 'connecting' ? 'Connecting' : 'Offline'}
            </span>
            {itemCount > 0 && (
              <span style={{
                background: 'var(--primary)',
                color: 'white',
                borderRadius: '9999px',
                padding: '0.125rem 0.625rem',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}>{itemCount} items</span>
            )}
          </div>
        </div>

        {remoteSale && remoteSale.itemCount > 0 && (
          <div className="live-sale-preview">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center' }}>
              <strong>Live current sale</strong>
              <span>{remoteSale.itemCount} items | à¸¿{remoteSale.total.toFixed(2)}</span>
            </div>
            <p>{remoteSale.items.slice(0, 2).map(item => `${item.name} x${item.quantity}`).join(', ')}</p>
          </div>
        )}
        
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.25rem' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--muted)', marginTop: '3rem' }}>
              <ShoppingBag size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
              <p style={{ fontWeight: 500 }}>No items yet</p>
              <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Scan a barcode to add products</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="cart-line">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>฿{item.price.toFixed(2)}</p>
                </div>
                <div className="cart-line-actions">
                  <button onClick={() => updateQuantity(item.id, -1)} style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
                    <Minus size={12} />
                  </button>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', minWidth: '24px', textAlign: 'center' }}>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
                    <Plus size={12} />
                  </button>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', minWidth: '56px', textAlign: 'right' }}>฿{(item.price * item.quantity).toFixed(2)}</span>
                  <button style={{ color: 'var(--danger)', marginLeft: '0.25rem' }} onClick={() => setCart(cart.filter(i => i.id !== item.id))}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
          <div className="pos-total-row">
            <span>Total</span>
            <span style={{ color: 'var(--primary)' }}>฿{total.toFixed(2)}</span>
          </div>
          {lastReceipt && (
            <button
              className="btn"
              style={{ width: '100%', padding: '0.875rem', marginBottom: '0.75rem', backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
              onClick={printReceipt}
            >
              <Printer size={18} />
              Print Last Receipt
            </button>
          )}
          <button 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}
            disabled={cart.length === 0 || loading}
            onClick={handleCheckout}
          >
            <CreditCard size={18} />
            Complete Checkout
          </button>
        </div>
      </div>
    </div>
  );
}
