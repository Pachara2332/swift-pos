export type BarcodeLabelSize = {
  width: number
  height: number
  module: number
  barHeight: number
  fontSize: number
}

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
] as const

export function createBarcodeLabelSvg({ value, title, price, size }: {
  value: string
  title: string
  price: string
  size: BarcodeLabelSize
}) {
  if (!value) throw new Error('Barcode is required')
  if (!/^[\x20-\x7E]+$/.test(value)) throw new Error('Code 128 supports English letters, numbers, and standard symbols only')

  const encoded = encodeCode128B(value)
  const totalModules = encoded.reduce((total, code) => total + code128Patterns[code].split('').reduce((sum, width) => sum + Number(width), 0), 0)
  const quiet = 10
  const barcodeWidth = totalModules * size.module
  const offsetX = Math.max(24, Math.floor((size.width - barcodeWidth) / 2))
  const offsetY = Math.floor(size.height * 0.34)
  let x = offsetX
  const bars: string[] = []

  for (const code of encoded) {
    const pattern = code128Patterns[code]
    for (let index = 0; index < pattern.length; index++) {
      const width = Number(pattern[index]) * size.module
      if (index % 2 === 0) {
        bars.push(`<rect x="${x}" y="${offsetY}" width="${width}" height="${size.barHeight}" fill="#111111" />`)
      }
      x += width
    }
  }

  const safeTitle = escapeXml(title || value)
  const safeValue = escapeXml(value)
  const safePrice = escapeXml(price ? `฿${price}` : '')

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size.width}" height="${size.height}" viewBox="0 0 ${size.width} ${size.height}" role="img" aria-label="Barcode ${safeValue}">
      <rect width="100%" height="100%" fill="#ffffff" />
      <text x="${size.width / 2}" y="${Math.floor(size.fontSize * 1.45)}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${size.fontSize}" font-weight="700" fill="#111111">${safeTitle}</text>
      ${safePrice ? `<text x="${size.width / 2}" y="${Math.floor(size.fontSize * 2.55)}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${Math.floor(size.fontSize * 0.9)}" font-weight="700" fill="#111111">${safePrice}</text>` : ''}
      <g transform="translate(${quiet},0)">${bars.join('')}</g>
      <text x="${size.width / 2}" y="${offsetY + size.barHeight + Math.floor(size.fontSize * 1.1)}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${Math.floor(size.fontSize * 0.78)}" fill="#111111" letter-spacing="2">${safeValue}</text>
    </svg>
  `
}

export function svgToPng(svgMarkup: string, width: number, height: number) {
  return new Promise<string>((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = width * 2
      canvas.height = height * 2
      const context = canvas.getContext('2d')
      if (!context) {
        reject(new Error('Canvas is not available'))
        return
      }
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.scale(2, 2)
      context.drawImage(image, 0, 0, width, height)
      resolve(canvas.toDataURL('image/png'))
    }
    image.onerror = () => reject(new Error('Unable to render barcode image'))
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`
  })
}

function encodeCode128B(value: string) {
  const codes = [104]
  for (const char of value) {
    const code = char.charCodeAt(0) - 32
    if (code < 0 || code > 94) throw new Error('Barcode contains unsupported characters')
    codes.push(code)
  }

  const checksum = codes.reduce((sum, code, index) => sum + (index === 0 ? code : code * index), 0) % 103
  return [...codes, checksum, 106]
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
