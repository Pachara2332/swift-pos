import type { Metadata } from 'next'
import './globals.css'
import AppShell from '@/components/AppShell'

export const metadata: Metadata = {
  title: 'Swift POS - ระบบขายหน้าร้าน',
  description: 'ระบบขายหน้าร้านพร้อมสแกนบาร์โค้ด จัดการสต็อก ติดตามยอดขาย และแดชบอร์ดวิเคราะห์ข้อมูล',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="th">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
