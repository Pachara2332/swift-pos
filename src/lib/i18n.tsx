'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type Language = 'th' | 'en'

type I18nContextValue = {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: string) => string
}

const dictionaries = {
  th: {
    'app.tagline': 'ระบบขายหน้าร้านอัจฉริยะ',
    'nav.menu': 'เมนู',
    'nav.pos': 'ขายสินค้า',
    'nav.dashboard': 'แดชบอร์ด',
    'nav.addProduct': 'เพิ่มสินค้า',
    'nav.inventory': 'สต็อกสินค้า',
    'nav.roles': 'สิทธิ์ผู้ใช้',
    'language.label': 'ภาษา',
    'language.th': 'ไทย',
    'language.en': 'EN',

    'role.active': 'บทบาทที่ใช้งาน',
    'role.switchTo': 'เปลี่ยนเป็น',
    'role.enterPassword': 'กรอกรหัสของบทบาท',
    'role.passwordPlaceholder': 'รหัสผ่าน',
    'role.cancel': 'ยกเลิก',
    'role.unlock': 'ปลดล็อก',
    'role.checking': 'กำลังตรวจสอบ...',
    'role.passwords': 'รหัสผ่านบทบาท',
    'role.passwordsNote': 'ใช้ OTP ทาง SMS ก่อนเปลี่ยนรหัสของแต่ละบทบาท',
    'role.role': 'บทบาท',
    'role.phone': 'เบอร์โทร',
    'role.currentPassword': 'รหัสผ่านปัจจุบัน',
    'role.newPassword': 'รหัสผ่านใหม่',
    'role.back': 'ย้อนกลับ',
    'role.sendOtp': 'ส่ง OTP',
    'role.changePassword': 'เปลี่ยนรหัสผ่าน',
    'role.working': 'กำลังทำงาน...',
    'role.otpSent': 'ส่ง OTP แล้ว โปรดตรวจ SMS',
    'role.passwordUpdated': 'เปลี่ยนรหัสผ่านแล้ว',
    'role.permissionsTitle': 'สิทธิ์ตามบทบาท',
    'role.permissionsSubtitle': 'โมเดลสิทธิ์สำหรับ Admin, Manager และ Cashier',
    'role.allow': 'อนุญาต',
    'role.adminNote': 'ควบคุมร้านได้ทั้งหมด',
    'role.managerNote': 'ดูแลการปฏิบัติงานและรายงาน',
    'role.cashierNote': 'ทำงานขายหน้าร้าน',
    'permission.sell': 'ขายสินค้า',
    'permission.viewInventory': 'ดูสต็อก',
    'permission.editProducts': 'แก้ไขสินค้า',
    'permission.openDashboard': 'เปิดแดชบอร์ด',
    'permission.manageRoles': 'จัดการบทบาท',
    'permission.reviewLowStock': 'ตรวจสินค้าสต็อกต่ำ',

    'pos.title': 'ขายสินค้า',
    'pos.subtitle': 'สแกนหรือพิมพ์บาร์โค้ดเพื่อเริ่มขาย',
    'pos.scanner': 'สแกนบาร์โค้ด',
    'pos.placeholder': 'สแกนบาร์โค้ด หรือพิมพ์แล้วกด Enter...',
    'pos.camera': 'กล้อง',
    'pos.close': 'ปิด',
    'pos.processing': 'กำลังประมวลผล...',
    'pos.currentSale': 'รายการขายปัจจุบัน',
    'pos.liveSale': 'ขายแบบสด',
    'pos.connecting': 'กำลังเชื่อมต่อ',
    'pos.offline': 'ออฟไลน์',
    'pos.items': 'รายการ',
    'pos.remoteSale': 'รายการขายสด',
    'pos.noItems': 'ยังไม่มีสินค้า',
    'pos.noItemsHint': 'สแกนบาร์โค้ดเพื่อเพิ่มสินค้า',
    'pos.total': 'รวม',
    'pos.printLastReceipt': 'พิมพ์ใบเสร็จล่าสุด',
    'pos.checkout': 'ชำระเงิน',
    'pos.added': 'เพิ่มลงตะกร้าแล้ว',
    'pos.externalFound': 'พบสินค้าจากออนไลน์ กำลังไปหน้าเพิ่มสินค้า...',
    'pos.notFound': 'ไม่พบสินค้า กำลังไปหน้าเพิ่มสินค้า...',
    'pos.serverError': 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้',
    'pos.saleCompleted': 'ขายสำเร็จ',
    'pos.checkoutFailed': 'ชำระเงินไม่สำเร็จ',
    'pos.checkoutError': 'เกิดข้อผิดพลาดตอนชำระเงิน',

    'inventory.title': 'สต็อกสินค้า',
    'inventory.productsTotal': 'สินค้าทั้งหมด',
    'inventory.lowStock': 'สต็อกต่ำ',
    'inventory.liveStock': 'สต็อกสด',
    'inventory.search': 'ค้นหาด้วยชื่อ แบรนด์ หรือบาร์โค้ด...',
    'inventory.loading': 'กำลังโหลดสต็อก...',
    'inventory.barcode': 'บาร์โค้ด',
    'inventory.product': 'สินค้า',
    'inventory.brand': 'แบรนด์',
    'inventory.price': 'ราคา',
    'inventory.stock': 'สต็อก',
    'inventory.status': 'สถานะ',
    'inventory.out': 'หมด',
    'inventory.low': 'ใกล้หมด',
    'inventory.inStock': 'พร้อมขาย',
    'inventory.noProducts': 'ไม่พบสินค้า',

    'product.backToPos': 'กลับไปหน้าขาย',
    'product.addTitle': 'เพิ่มสินค้าใหม่',
    'product.barcode': 'บาร์โค้ด',
    'product.name': 'ชื่อสินค้า',
    'product.brand': 'แบรนด์',
    'product.category': 'หมวดหมู่',
    'product.costPrice': 'ราคาทุน (บาท)',
    'product.salePrice': 'ราคาขาย (บาท)',
    'product.currentStock': 'สต็อกปัจจุบัน',
    'product.lowStockAlert': 'แจ้งเตือนสต็อกต่ำ',
    'product.preview': 'ตัวอย่างรูปสินค้า (จาก Open Food Facts)',
    'product.saving': 'กำลังบันทึก...',
    'product.save': 'บันทึกสินค้า',
    'product.saved': 'บันทึกสินค้าเรียบร้อย',
    'product.networkError': 'เกิดปัญหาเครือข่าย',

    'dashboard.loading': 'กำลังเตรียมข้อมูลร้าน...',
    'dashboard.unavailable': 'ยังโหลดข้อมูลแดชบอร์ดไม่ได้',
    'dashboard.retry': 'โปรดลองอีกครั้งเมื่อฐานข้อมูลพร้อมใช้งาน',
    'dashboard.kicker': 'ภาพรวมหลังร้าน',
    'dashboard.title': 'รายงานร้าน',
    'dashboard.subtitle': 'รายได้ การเคลื่อนไหวสินค้า และสต็อกที่ต้องดูแลในวันนี้',
    'dashboard.todayRevenue': 'รายได้วันนี้',
    'dashboard.transactions': 'รายการขาย',
    'dashboard.averageTicket': 'ยอดเฉลี่ยต่อบิล',
    'dashboard.lowStock': 'สต็อกต่ำ',
    'dashboard.revenueTrend': 'แนวโน้มรายได้',
    'dashboard.last14': '14 วันล่าสุด',
    'dashboard.stockWatch': 'เฝ้าระวังสต็อก',
    'dashboard.stockNote': 'สินค้าที่ต้องดูแล',
    'dashboard.healthy': 'สต็อกดูปกติ',
    'dashboard.threshold': 'เกณฑ์',
    'dashboard.left': 'คงเหลือ',
    'dashboard.topSellers': 'สินค้าขายดี',
    'dashboard.unitsSold': 'จำนวนที่ขายวันนี้',
    'dashboard.noSales': 'วันนี้ยังไม่มีการขาย',
    'dashboard.salesByHour': 'ยอดขายรายชั่วโมง',
    'dashboard.counterRhythm': 'จังหวะหน้าร้าน',
    'dashboard.noHourly': 'ยังไม่มีข้อมูลรายชั่วโมง',
  },
  en: {
    'app.tagline': 'Smart Point of Sale',
    'nav.menu': 'Menu',
    'nav.pos': 'Point of Sale',
    'nav.dashboard': 'Dashboard',
    'nav.addProduct': 'Add Product',
    'nav.inventory': 'Inventory',
    'nav.roles': 'Roles',
    'language.label': 'Language',
    'language.th': 'ไทย',
    'language.en': 'EN',

    'role.active': 'Active Role',
    'role.switchTo': 'Switch to',
    'role.enterPassword': 'Enter the role password',
    'role.passwordPlaceholder': 'Password',
    'role.cancel': 'Cancel',
    'role.unlock': 'Unlock',
    'role.checking': 'Checking...',
    'role.passwords': 'Role Passwords',
    'role.passwordsNote': 'Use SMS OTP before changing each role password',
    'role.role': 'Role',
    'role.phone': 'Phone',
    'role.currentPassword': 'Current Password',
    'role.newPassword': 'New Password',
    'role.back': 'Back',
    'role.sendOtp': 'Send OTP',
    'role.changePassword': 'Change Password',
    'role.working': 'Working...',
    'role.otpSent': 'OTP sent. Check SMS.',
    'role.passwordUpdated': 'password updated',
    'role.permissionsTitle': 'Role Permissions',
    'role.permissionsSubtitle': 'RBAC model for Admin, Manager, and Cashier access',
    'role.allow': 'Allow',
    'role.adminNote': 'Full store control',
    'role.managerNote': 'Operations and reporting',
    'role.cashierNote': 'Front counter workflow',
    'permission.sell': 'Sell products',
    'permission.viewInventory': 'View inventory',
    'permission.editProducts': 'Edit products',
    'permission.openDashboard': 'Open dashboard',
    'permission.manageRoles': 'Manage roles',
    'permission.reviewLowStock': 'Review low stock',

    'pos.title': 'Point of Sale',
    'pos.subtitle': 'Scan or type a barcode to start selling',
    'pos.scanner': 'Barcode Scanner',
    'pos.placeholder': 'Scan barcode or type and press Enter...',
    'pos.camera': 'Camera',
    'pos.close': 'Close',
    'pos.processing': 'Processing...',
    'pos.currentSale': 'Current Sale',
    'pos.liveSale': 'Live sale',
    'pos.connecting': 'Connecting',
    'pos.offline': 'Offline',
    'pos.items': 'items',
    'pos.remoteSale': 'Live current sale',
    'pos.noItems': 'No items yet',
    'pos.noItemsHint': 'Scan a barcode to add products',
    'pos.total': 'Total',
    'pos.printLastReceipt': 'Print Last Receipt',
    'pos.checkout': 'Complete Checkout',
    'pos.added': 'added to cart',
    'pos.externalFound': 'Product found online, redirecting to add...',
    'pos.notFound': 'Product not found, redirecting to add...',
    'pos.serverError': 'Error connecting to server',
    'pos.saleCompleted': 'Sale completed',
    'pos.checkoutFailed': 'Checkout failed',
    'pos.checkoutError': 'Checkout error',

    'inventory.title': 'Inventory',
    'inventory.productsTotal': 'products total',
    'inventory.lowStock': 'low stock',
    'inventory.liveStock': 'Live stock',
    'inventory.search': 'Search by name, brand, or barcode...',
    'inventory.loading': 'Loading inventory...',
    'inventory.barcode': 'Barcode',
    'inventory.product': 'Product',
    'inventory.brand': 'Brand',
    'inventory.price': 'Price',
    'inventory.stock': 'Stock',
    'inventory.status': 'Status',
    'inventory.out': 'Out of Stock',
    'inventory.low': 'Low Stock',
    'inventory.inStock': 'In Stock',
    'inventory.noProducts': 'No products found',

    'product.backToPos': 'Back to POS',
    'product.addTitle': 'Add New Product',
    'product.barcode': 'Barcode',
    'product.name': 'Product Name',
    'product.brand': 'Brand',
    'product.category': 'Category',
    'product.costPrice': 'Cost Price (THB)',
    'product.salePrice': 'Sale Price (THB)',
    'product.currentStock': 'Current Stock',
    'product.lowStockAlert': 'Low Stock Alert',
    'product.preview': 'Product Image Preview (from Open Food Facts)',
    'product.saving': 'Saving...',
    'product.save': 'Save Product',
    'product.saved': 'Product saved successfully',
    'product.networkError': 'Network error',

    'dashboard.loading': 'Preparing store ledger...',
    'dashboard.unavailable': 'Dashboard data is unavailable.',
    'dashboard.retry': 'Please try again after the database is reachable.',
    'dashboard.kicker': 'Back office snapshot',
    'dashboard.title': 'Store ledger',
    'dashboard.subtitle': 'Revenue, product movement, and stock pressure for today.',
    'dashboard.todayRevenue': 'Today revenue',
    'dashboard.transactions': 'Transactions',
    'dashboard.averageTicket': 'Average ticket',
    'dashboard.lowStock': 'Low stock',
    'dashboard.revenueTrend': 'Revenue trend',
    'dashboard.last14': 'Last 14 days',
    'dashboard.stockWatch': 'Stock watch',
    'dashboard.stockNote': 'Items needing attention',
    'dashboard.healthy': 'Inventory looks healthy',
    'dashboard.threshold': 'Threshold',
    'dashboard.left': 'left',
    'dashboard.topSellers': 'Top sellers',
    'dashboard.unitsSold': 'Units sold today',
    'dashboard.noSales': 'No sales today yet',
    'dashboard.salesByHour': 'Sales by hour',
    'dashboard.counterRhythm': 'Counter rhythm',
    'dashboard.noHourly': 'No hourly sales to show',
  },
} satisfies Record<Language, Record<string, string>>

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'th'
    const stored = window.localStorage.getItem('swift-pos-language')
    if (stored === 'th' || stored === 'en') {
      return stored
    }
    return 'th'
  })

  const value = useMemo<I18nContextValue>(() => ({
    language,
    setLanguage(nextLanguage) {
      setLanguageState(nextLanguage)
      window.localStorage.setItem('swift-pos-language', nextLanguage)
      document.documentElement.lang = nextLanguage
    },
    t(key) {
      const activeDictionary: Record<string, string> = dictionaries[language]
      const fallbackDictionary: Record<string, string> = dictionaries.en
      return activeDictionary[key] ?? fallbackDictionary[key] ?? key
    },
  }), [language])

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used inside I18nProvider')
  }
  return context
}
