'use client';

import { useEffect, useMemo, useState } from 'react';
import { Barcode, Download, Printer, RefreshCw } from 'lucide-react';

type Product = {
  id: string;
  barcode: string;
  name: string;
  salePrice: number;
  category: string | null;
};

type LabelSize = 'small' | 'medium' | 'large';

const code128Patterns = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112',
] as const;

const labelSizes: Record<LabelSize, { width: number; height: number; module: number; barHeight: number; fontSize: number }> = {
  small: { width: 360, height: 190, module: 2, barHeight: 86, fontSize: 18 },
  medium: { width: 480, height: 250, module: 3, barHeight: 118, fontSize: 22 },
  large: { width: 640, height: 330, module: 4, barHeight: 158, fontSize: 28 },
};

export default function BarcodeGeneratorPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [barcode, setBarcode] = useState('210100000001');
  const [title, setTitle] = useState('เนื้อวัว 0.1 กก.');
  const [price, setPrice] = useState('39.00');
  const [labelSize, setLabelSize] = useState<LabelSize>('medium');
  const [copies, setCopies] = useState(6);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => setProducts(Array.isArray(data) ? data : []))
      .catch(() => setProducts([]));
  }, []);

  const selectedProduct = useMemo(() => products.find(product => product.id === selectedProductId), [products, selectedProductId]);
  const barcodePreview = useMemo(() => {
    try {
      return {
        error: '',
        svg: createBarcodeLabelSvg({
          value: barcode.trim(),
          title: title.trim(),
          price: price.trim(),
          size: labelSizes[labelSize],
        }),
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unable to generate barcode',
        svg: '',
      };
    }
  }, [barcode, labelSize, price, title]);
  const svgMarkup = barcodePreview.svg;
  const error = barcodePreview.error;

  const chooseProduct = (productId: string) => {
    setSelectedProductId(productId);
    const product = products.find(item => item.id === productId);
    if (!product) return;

    setBarcode(product.barcode);
    setTitle(product.name);
    setPrice(product.salePrice.toFixed(2));
  };

  const randomMockBarcode = () => {
    const prefix = ['210100', '210200', '210300'][Math.floor(Math.random() * 3)];
    const sequence = String(Math.floor(Math.random() * 200) + 1).padStart(6, '0');
    setSelectedProductId('');
    setBarcode(`${prefix}${sequence}`);
  };

  const downloadPng = async () => {
    if (!svgMarkup) return;

    const dataUrl = await svgToPng(svgMarkup, labelSizes[labelSize].width, labelSizes[labelSize].height);
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `barcode-${barcode || 'label'}.png`;
    link.click();
  };

  const printLabels = () => {
    if (!svgMarkup) return;

    const labels = Array.from({ length: copies }, () => `<div class="label">${svgMarkup}</div>`).join('');
    const printWindow = window.open('', 'swift-pos-barcode-print', 'width=900,height=700');
    if (!printWindow) return;

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Barcode Labels</title>
          <style>
            @page { size: A4; margin: 10mm; }
            body { margin: 0; font-family: Arial, sans-serif; }
            .sheet { display: grid; grid-template-columns: repeat(2, max-content); gap: 8mm; align-items: start; }
            .label { break-inside: avoid; }
            svg { display: block; width: ${labelSizes[labelSize].width}px; height: ${labelSizes[labelSize].height}px; }
          </style>
        </head>
        <body><main class="sheet">${labels}</main></body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="barcode-page">
      <header className="page-toolbar">
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Barcode size={26} color="var(--primary)" />
            สร้างบาร์โค้ด
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>ทำภาพบาร์โค้ดสำหรับปริ้นแปะสินค้า</p>
        </div>
      </header>

      <section className="barcode-workspace">
        <form className="card barcode-controls" onSubmit={event => event.preventDefault()}>
          <div className="input-group">
            <label>เลือกสินค้า</label>
            <select className="input-field" value={selectedProductId} onChange={event => chooseProduct(event.target.value)}>
              <option value="">กำหนดเอง</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} | {product.barcode}
                </option>
              ))}
            </select>
          </div>

          <div className="form-grid">
            <div className="input-group">
              <label>บาร์โค้ด</label>
              <input className="input-field" value={barcode} onChange={event => setBarcode(event.target.value)} placeholder="210100000001" />
            </div>
            <div className="input-group">
              <label>ราคา</label>
              <input className="input-field" value={price} onChange={event => setPrice(event.target.value)} placeholder="39.00" />
            </div>
          </div>

          <div className="input-group">
            <label>ชื่อบนฉลาก</label>
            <input className="input-field" value={title} onChange={event => setTitle(event.target.value)} placeholder="ชื่อสินค้า" />
          </div>

          <div className="form-grid">
            <div className="input-group">
              <label>ขนาดฉลาก</label>
              <select className="input-field" value={labelSize} onChange={event => setLabelSize(event.target.value as LabelSize)}>
                <option value="small">เล็ก</option>
                <option value="medium">กลาง</option>
                <option value="large">ใหญ่</option>
              </select>
            </div>
            <div className="input-group">
              <label>จำนวนตอนปริ้น</label>
              <input className="input-field" type="number" min={1} max={48} value={copies} onChange={event => setCopies(Number(event.target.value) || 1)} />
            </div>
          </div>

          <div className="barcode-actions">
            <button type="button" className="btn btn-quiet" onClick={randomMockBarcode}>
              <RefreshCw size={18} />
              สุ่มรหัส
            </button>
            <button type="button" className="btn btn-quiet" onClick={downloadPng} disabled={!svgMarkup}>
              <Download size={18} />
              PNG
            </button>
            <button type="button" className="btn btn-primary" onClick={printLabels} disabled={!svgMarkup}>
              <Printer size={18} />
              Print
            </button>
          </div>
        </form>

        <div className="card barcode-preview-panel">
          {selectedProduct && (
            <p className="barcode-product-note">{selectedProduct.category || 'สินค้า'} | {selectedProduct.name}</p>
          )}
          {error ? (
            <div className="dashboard-error">
              <strong>สร้างบาร์โค้ดไม่ได้</strong>
              <p>{error}</p>
            </div>
          ) : (
            <div className="barcode-preview" dangerouslySetInnerHTML={{ __html: svgMarkup }} />
          )}
        </div>
      </section>
    </div>
  );
}

function createBarcodeLabelSvg({ value, title, price, size }: {
  value: string;
  title: string;
  price: string;
  size: { width: number; height: number; module: number; barHeight: number; fontSize: number };
}) {
  if (!value) throw new Error('กรุณาใส่บาร์โค้ด');
  if (!/^[\x20-\x7E]+$/.test(value)) throw new Error('Code 128 รองรับตัวอักษรอังกฤษ ตัวเลข และสัญลักษณ์มาตรฐานในช่องบาร์โค้ด');

  const encoded = encodeCode128B(value);
  const totalModules = encoded.reduce((total, code) => total + code128Patterns[code].split('').reduce((sum, width) => sum + Number(width), 0), 0);
  const quiet = 10;
  const barcodeWidth = totalModules * size.module;
  const offsetX = Math.max(24, Math.floor((size.width - barcodeWidth) / 2));
  const offsetY = Math.floor(size.height * 0.34);
  let x = offsetX;
  const bars: string[] = [];

  for (const code of encoded) {
    const pattern = code128Patterns[code];
    for (let index = 0; index < pattern.length; index++) {
      const width = Number(pattern[index]) * size.module;
      if (index % 2 === 0) {
        bars.push(`<rect x="${x}" y="${offsetY}" width="${width}" height="${size.barHeight}" fill="#111111" />`);
      }
      x += width;
    }
  }

  const safeTitle = escapeXml(title || value);
  const safeValue = escapeXml(value);
  const safePrice = escapeXml(price ? `฿${price}` : '');

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size.width}" height="${size.height}" viewBox="0 0 ${size.width} ${size.height}" role="img" aria-label="Barcode ${safeValue}">
      <rect width="100%" height="100%" fill="#ffffff" />
      <text x="${size.width / 2}" y="${Math.floor(size.fontSize * 1.45)}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${size.fontSize}" font-weight="700" fill="#111111">${safeTitle}</text>
      ${safePrice ? `<text x="${size.width / 2}" y="${Math.floor(size.fontSize * 2.55)}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${Math.floor(size.fontSize * 0.9)}" font-weight="700" fill="#111111">${safePrice}</text>` : ''}
      <g transform="translate(${quiet},0)">${bars.join('')}</g>
      <text x="${size.width / 2}" y="${offsetY + size.barHeight + Math.floor(size.fontSize * 1.1)}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${Math.floor(size.fontSize * 0.78)}" fill="#111111" letter-spacing="2">${safeValue}</text>
    </svg>
  `;
}

function encodeCode128B(value: string) {
  const codes = [104];
  for (const char of value) {
    const code = char.charCodeAt(0) - 32;
    if (code < 0 || code > 94) throw new Error('บาร์โค้ดมีตัวอักษรที่ไม่รองรับ');
    codes.push(code);
  }

  const checksum = codes.reduce((sum, code, index) => sum + (index === 0 ? code : code * index), 0) % 103;
  return [...codes, checksum, 106];
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function svgToPng(svgMarkup: string, width: number, height: number) {
  return new Promise<string>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width * 2;
      canvas.height = height * 2;
      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('Canvas is not available'));
        return;
      }
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.scale(2, 2);
      context.drawImage(image, 0, 0, width, height);
      resolve(canvas.toDataURL('image/png'));
    };
    image.onerror = () => reject(new Error('Unable to render barcode image'));
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`;
  });
}
