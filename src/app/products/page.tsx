'use client';
import { useState, useEffect, useCallback } from 'react';
import { Package, Search, AlertTriangle, Radio } from 'lucide-react';
import Link from 'next/link';

type Product = {
  id: string;
  barcode: string;
  name: string;
  brand: string;
  stock: number;
  salePrice: number;
  costPrice: number;
  lowStockAlert: number;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [liveStatus, setLiveStatus] = useState<'connecting' | 'live' | 'offline'>('connecting');

  const loadProducts = useCallback(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    const events = new EventSource('/api/realtime');

    events.addEventListener('connected', () => setLiveStatus('live'));
    events.addEventListener('product.changed', () => loadProducts());
    events.addEventListener('sale.completed', () => loadProducts());
    events.onerror = () => setLiveStatus('offline');

    return () => events.close();
  }, [loadProducts]);

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.barcode.includes(search) ||
    (p.brand && p.brand.toLowerCase().includes(search.toLowerCase()))
  );

  const lowStockCount = products.filter(p => p.stock <= p.lowStockAlert).length;

  return (
    <div>
      <div className="page-toolbar">
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Inventory</h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
            {products.length} products total
            {lowStockCount > 0 && (
              <span style={{ color: 'var(--danger)', marginLeft: '1rem', fontWeight: 500 }}>
                <AlertTriangle size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.25rem' }} />
                {lowStockCount} low stock
              </span>
            )}
            <span className={`live-pill live-pill-${liveStatus}`}>
              <Radio size={13} />
              {liveStatus === 'live' ? 'Live stock' : liveStatus === 'connecting' ? 'Connecting' : 'Offline'}
            </span>
          </p>
        </div>
        <Link href="/products/add" className="btn btn-primary">
          Add Product
        </Link>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', padding: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 0.75rem' }}>
          <Search size={18} color="var(--muted)" />
          <input 
            type="text" 
            placeholder="Search by name, brand, or barcode..." 
            style={{ flex: 1, border: 'none', background: 'none', outline: 'none', padding: '0.5rem', color: 'var(--foreground)', fontSize: '0.95rem' }}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card data-table-card">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)' }}>
            <div style={{ width: '24px', height: '24px', border: '3px solid var(--border)', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin 0.6s linear infinite', margin: '0 auto 1rem' }}></div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            Loading inventory...
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: 'var(--muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Barcode</th>
                <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: 'var(--muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Product</th>
                <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: 'var(--muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Brand</th>
                <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: 'var(--muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Price</th>
                <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: 'var(--muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Stock</th>
                <th style={{ padding: '1rem 1.25rem', fontWeight: 600, color: 'var(--muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(product => (
                <tr key={product.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem 1.25rem', fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--muted)' }}>{product.barcode}</td>
                  <td style={{ padding: '1rem 1.25rem', fontWeight: 600 }}>{product.name}</td>
                  <td style={{ padding: '1rem 1.25rem', color: 'var(--muted)' }}>{product.brand || '—'}</td>
                  <td style={{ padding: '1rem 1.25rem', textAlign: 'right', fontWeight: 500 }}>฿{product.salePrice.toFixed(2)}</td>
                  <td style={{ padding: '1rem 1.25rem', textAlign: 'right', fontWeight: 600 }}>{product.stock}</td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    {product.stock === 0 ? (
                      <span className="badge badge-danger">Out of Stock</span>
                    ) : product.stock <= product.lowStockAlert ? (
                      <span className="badge badge-warning">Low Stock</span>
                    ) : (
                      <span className="badge badge-success">In Stock</span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)' }}>
                    <Package size={40} style={{ opacity: 0.2, margin: '0 auto 0.5rem', display: 'block' }} />
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
