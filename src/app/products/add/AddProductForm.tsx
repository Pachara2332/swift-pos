'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Save, ArrowLeft, PackagePlus } from 'lucide-react';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';

const categorySuggestions = ['เนื้อวัว', 'เนื้อหมู', 'เนื้อไก่'];

export default function AddProductForm() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState(() => ({
    barcode: searchParams.get('barcode') || '',
    name: searchParams.get('name') || '',
    brand: searchParams.get('brand') || '',
    imageUrl: searchParams.get('imageUrl') || '',
    category: '',
    costPrice: '',
    salePrice: '',
    stock: '',
    lowStockAlert: '5'
  }));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        alert(t('product.saved'));
        router.push('/products');
      } else {
        const error = await res.json();
        alert(`Error: ${error.error}`);
      }
    } catch {
      alert(t('product.networkError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <div className="page-toolbar add-product-toolbar">
        <Link href="/" className="btn" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
          <ArrowLeft size={20} /> {t('product.backToPos')}
        </Link>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <PackagePlus size={24} color="var(--primary)" />
          {t('product.addTitle')}
        </h1>
      </div>

      <form className="card" onSubmit={handleSubmit}>
        <div className="form-grid">
          
          <div className="input-group">
            <label style={{ fontWeight: 500 }}>{t('product.barcode')}</label>
            <input required type="text" name="barcode" value={formData.barcode} onChange={handleChange} className="input-field" placeholder="8851234567890" />
          </div>

          <div className="input-group">
            <label style={{ fontWeight: 500 }}>{t('product.name')}</label>
            <input required type="text" name="name" value={formData.name} onChange={handleChange} className="input-field" placeholder="Lays Classic" />
          </div>

          <div className="input-group">
            <label style={{ fontWeight: 500 }}>{t('product.brand')}</label>
            <input type="text" name="brand" value={formData.brand} onChange={handleChange} className="input-field" placeholder="Lays" />
          </div>

          <div className="input-group">
            <label style={{ fontWeight: 500 }}>{t('product.category')}</label>
            <input type="text" name="category" value={formData.category} onChange={handleChange} className="input-field" placeholder={t('product.category')} list="product-category-suggestions" />
            <datalist id="product-category-suggestions">
              {categorySuggestions.map(category => (
                <option key={category} value={category} />
              ))}
            </datalist>
          </div>

          <div className="input-group">
            <label style={{ fontWeight: 500 }}>{t('product.costPrice')}</label>
            <input required type="number" step="0.01" name="costPrice" value={formData.costPrice} onChange={handleChange} className="input-field" placeholder="15.00" />
          </div>

          <div className="input-group">
            <label style={{ fontWeight: 500 }}>{t('product.salePrice')}</label>
            <input required type="number" step="0.01" name="salePrice" value={formData.salePrice} onChange={handleChange} className="input-field" placeholder="20.00" />
          </div>

          <div className="input-group">
            <label style={{ fontWeight: 500 }}>{t('product.currentStock')}</label>
            <input required type="number" name="stock" value={formData.stock} onChange={handleChange} className="input-field" placeholder="50" />
          </div>

          <div className="input-group">
            <label style={{ fontWeight: 500 }}>{t('product.lowStockAlert')}</label>
            <input required type="number" name="lowStockAlert" value={formData.lowStockAlert} onChange={handleChange} className="input-field" placeholder="5" />
          </div>

        </div>

        {formData.imageUrl && (
          <div style={{ marginTop: '1.5rem', padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', display: 'inline-block' }}>
            <p style={{ marginBottom: '0.5rem', color: 'var(--muted)', fontSize: '0.875rem' }}>{t('product.preview')}</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={formData.imageUrl} alt="Preview" style={{ height: '100px', borderRadius: '4px' }} />
          </div>
        )}

        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            <Save size={20} />
            {loading ? t('product.saving') : t('product.save')}
          </button>
        </div>
      </form>
    </div>
  );
}
