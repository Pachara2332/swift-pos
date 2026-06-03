'use client';
import { Suspense, useState, useEffect, useCallback, useMemo } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Package, Search, AlertTriangle, Radio } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import { useActiveRole } from '@/lib/role-context';

type Product = {
  id: string;
  barcode: string;
  name: string;
  brand: string;
  category: string | null;
  stock: number;
  salePrice: number;
  costPrice: number;
  lowStockAlert: number;
};

type SortKey = 'barcode' | 'name' | 'category' | 'brand' | 'salePrice' | 'stock' | 'status';
type SortDirection = 'asc' | 'desc';

export default function ProductsPage() {
  return (
    <Suspense fallback={null}>
      <ProductsContent />
    </Suspense>
  );
}

function SortableHeader({
  label,
  sortKey,
  activeSortKey,
  direction,
  onSort,
  align = 'left',
}: {
  label: string;
  sortKey: SortKey;
  activeSortKey: SortKey;
  direction: SortDirection;
  onSort: (sortKey: SortKey) => void;
  align?: 'left' | 'right';
}) {
  const active = sortKey === activeSortKey;
  const Icon = active ? (direction === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;

  return (
    <th className={align === 'right' ? 'sortable-header sortable-header-right' : 'sortable-header'} aria-sort={active ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button type="button" onClick={() => onSort(sortKey)}>
        <span>{label}</span>
        <Icon size={14} />
      </button>
    </th>
  );
}

function getSortValue(product: Product, sortKey: SortKey) {
  if (sortKey === 'status') {
    if (product.stock === 0) return 0;
    if (product.stock <= product.lowStockAlert) return 1;
    return 2;
  }

  return product[sortKey] ?? '';
}

function ProductsContent() {
  const { t } = useI18n();
  const { role } = useActiveRole();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [liveStatus, setLiveStatus] = useState<'connecting' | 'live' | 'offline'>('connecting');
  const lowStockOnly = searchParams.get('filter') === 'low-stock';

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

  const lowStockCount = products.filter(p => p.stock <= p.lowStockAlert).length;
  const categories = Array.from(new Set(products.map(p => p.category).filter((category): category is string => Boolean(category)))).sort((a, b) => a.localeCompare(b));
  const filtered = products.filter(p => {
    if (lowStockOnly && p.stock > p.lowStockAlert) return false;
    if (categoryFilter && p.category !== categoryFilter) return false;

    return (
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.includes(search) ||
      (p.brand && p.brand.toLowerCase().includes(search.toLowerCase())) ||
      (p.category && p.category.toLowerCase().includes(search.toLowerCase()))
    );
  });
  const sortedProducts = useMemo(() => {
    const direction = sortDirection === 'asc' ? 1 : -1;

    return [...filtered].sort((a, b) => {
      const first = getSortValue(a, sortKey);
      const second = getSortValue(b, sortKey);

      if (typeof first === 'number' && typeof second === 'number') {
        return (first - second) * direction;
      }

      return String(first).localeCompare(String(second), undefined, { numeric: true, sensitivity: 'base' }) * direction;
    });
  }, [filtered, sortDirection, sortKey]);

  const changeSort = (nextSortKey: SortKey) => {
    if (nextSortKey === sortKey) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
      return;
    }

    setSortKey(nextSortKey);
    setSortDirection('asc');
  };

  return (
    <div>
      <div className="page-toolbar">
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>{t('inventory.title')}</h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
            {products.length} {t('inventory.productsTotal')}
            {lowStockCount > 0 && (
              <span style={{ color: 'var(--danger)', marginLeft: '1rem', fontWeight: 500 }}>
                <AlertTriangle size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.25rem' }} />
                {lowStockCount} {t('inventory.lowStock')}
              </span>
            )}
            <span className={`live-pill live-pill-${liveStatus}`}>
              <Radio size={13} />
              {liveStatus === 'live' ? t('inventory.liveStock') : liveStatus === 'connecting' ? t('pos.connecting') : t('pos.offline')}
            </span>
          </p>
        </div>
        {role === 'Admin' && (
          <Link href="/products/add" className="btn btn-primary">
            {t('nav.addProduct')}
          </Link>
        )}
      </div>

      <div className="card inventory-filters">
        <div className="inventory-search">
          <Search size={18} color="var(--muted)" />
          <input 
            type="text" 
            placeholder={t('inventory.search')}
            style={{ flex: 1, border: 'none', background: 'none', outline: 'none', padding: '0.5rem', color: 'var(--foreground)', fontSize: '0.95rem' }}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input-field inventory-category-filter"
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          aria-label={t('inventory.categoryFilter')}
        >
          <option value="">{t('inventory.allCategories')}</option>
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      <div className="card data-table-card">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)' }}>
            <div style={{ width: '24px', height: '24px', border: '3px solid var(--border)', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin 0.6s linear infinite', margin: '0 auto 1rem' }}></div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            {t('inventory.loading')}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <SortableHeader label={t('inventory.barcode')} sortKey="barcode" activeSortKey={sortKey} direction={sortDirection} onSort={changeSort} />
                <SortableHeader label={t('inventory.product')} sortKey="name" activeSortKey={sortKey} direction={sortDirection} onSort={changeSort} />
                <SortableHeader label={t('inventory.category')} sortKey="category" activeSortKey={sortKey} direction={sortDirection} onSort={changeSort} />
                <SortableHeader label={t('inventory.brand')} sortKey="brand" activeSortKey={sortKey} direction={sortDirection} onSort={changeSort} />
                <SortableHeader label={t('inventory.price')} sortKey="salePrice" activeSortKey={sortKey} direction={sortDirection} onSort={changeSort} align="right" />
                <SortableHeader label={t('inventory.stock')} sortKey="stock" activeSortKey={sortKey} direction={sortDirection} onSort={changeSort} align="right" />
                <SortableHeader label={t('inventory.status')} sortKey="status" activeSortKey={sortKey} direction={sortDirection} onSort={changeSort} />
              </tr>
            </thead>
            <tbody>
              {sortedProducts.map(product => (
                <tr key={product.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem 1.25rem', fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--muted)' }}>{product.barcode}</td>
                  <td style={{ padding: '1rem 1.25rem', fontWeight: 600 }}>{product.name}</td>
                  <td style={{ padding: '1rem 1.25rem', color: 'var(--muted)' }}>{product.category || 'â€”'}</td>
                  <td style={{ padding: '1rem 1.25rem', color: 'var(--muted)' }}>{product.brand || '—'}</td>
                  <td style={{ padding: '1rem 1.25rem', textAlign: 'right', fontWeight: 500 }}>฿{product.salePrice.toFixed(2)}</td>
                  <td style={{ padding: '1rem 1.25rem', textAlign: 'right', fontWeight: 600 }}>{product.stock}</td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    {product.stock === 0 ? (
                      <span className="badge badge-danger">{t('inventory.out')}</span>
                    ) : product.stock <= product.lowStockAlert ? (
                      <span className="badge badge-warning">{t('inventory.low')}</span>
                    ) : (
                      <span className="badge badge-success">{t('inventory.inStock')}</span>
                    )}
                  </td>
                </tr>
              ))}
              {sortedProducts.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)' }}>
                    <Package size={40} style={{ opacity: 0.2, margin: '0 auto 0.5rem', display: 'block' }} />
                    {t('inventory.noProducts')}
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
