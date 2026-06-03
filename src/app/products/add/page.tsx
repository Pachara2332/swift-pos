'use client';

import { Suspense } from 'react';
import AddProductForm from './AddProductForm';
import { useI18n } from '@/lib/i18n';

export default function AddProductPage() {
  const { t } = useI18n();

  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>{t('inventory.loading')}</div>}>
      <AddProductForm />
    </Suspense>
  );
}
