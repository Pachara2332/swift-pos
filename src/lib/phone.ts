export function normalizePhoneNumber(value: string) {
  const compact = value.trim().replace(/[\s().-]/g, '')

  if (compact.startsWith('+')) {
    return compact
  }

  if (compact.startsWith('00')) {
    return `+${compact.slice(2)}`
  }

  if (compact.startsWith('0')) {
    return `+66${compact.slice(1)}`
  }

  return compact
}

export function isValidE164PhoneNumber(value: string) {
  return /^\+[1-9]\d{7,14}$/.test(value)
}
