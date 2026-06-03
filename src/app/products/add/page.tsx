'use client';

import { Suspense } from 'react';
import AddProductForm from './AddProductForm';

export default function AddProductPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>Loading...</div>}>
      <AddProductForm />
    </Suspense>
  );
}
