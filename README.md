# Swift POS

Swift POS คือระบบขายหน้าร้านบน Next.js สำหรับร้านค้าขนาดเล็กถึงกลาง รองรับการขายด้วยบาร์โค้ด จัดการสินค้า สต็อกแบบ real time แดชบอร์ดวิเคราะห์ยอดขาย และระบบบทบาทผู้ใช้พร้อม OTP ผ่าน SMS

## Features

- Point of Sale สำหรับสแกนหรือพิมพ์บาร์โค้ดแล้วเพิ่มสินค้าเข้ารายการขาย
- Inventory สำหรับดูสินค้า ราคา สต็อก และสถานะใกล้หมด
- Add Product พร้อมรองรับข้อมูลตั้งต้นจาก Open Food Facts เมื่อสแกนบาร์โค้ดที่ยังไม่มีในระบบ
- Dashboard แสดงรายได้วันนี้ รายการขาย สินค้าขายดี สต็อกต่ำ และยอดขายรายชั่วโมง
- Role access สำหรับ Admin, Manager และ Cashier
- เปลี่ยน role ต้องใส่รหัสทุกครั้ง
- เปลี่ยนรหัส role ด้วย OTP ผ่าน Twilio Verify SMS
- Realtime stream/webhook สำหรับอัปเดต stock และ current sale
- ระบบ 2 ภาษา ไทย/อังกฤษ โดยค่าเริ่มต้นเป็นภาษาไทย

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Prisma 7
- PostgreSQL/Neon
- Chart.js
- Twilio Verify

## Getting Started

ติดตั้ง dependencies:

```bash
npm install
```

สร้าง Prisma client:

```bash
npx prisma generate
```

Sync schema เข้าฐานข้อมูล:

```bash
npx prisma db push
```

รัน development server:

```bash
npm run dev
```

เปิดใช้งานที่:

```text
http://localhost:3000
```

## Environment Variables

สร้างไฟล์ `.env` แล้วกำหนดค่าหลัก:

```env
DATABASE_URL="postgresql://..."

TWILIO_ACCOUNT_SID="ACxxxxxxxx"
TWILIO_AUTH_TOKEN="xxxxxxxx"
TWILIO_VERIFY_SERVICE_SID="VAxxxxxxxx"

SWIFT_POS_DEFAULT_ROLE_PASSWORD="123456"
REALTIME_WEBHOOK_TOKEN="optional-webhook-token"
```

หมายเหตุ:

- `SWIFT_POS_DEFAULT_ROLE_PASSWORD` คือรหัสเริ่มต้นของ role ที่ยังไม่เคยถูกสร้างในฐานข้อมูล
- Twilio ต้องใช้เบอร์รูปแบบ E.164 เช่น `+66990094187`; ระบบจะแปลงเบอร์ไทยที่ขึ้นต้น `0` ให้อัตโนมัติ
- ถ้าไม่ได้ตั้งค่า Twilio ครบ ระบบจะ fallback ไป mock SMS สำหรับทดสอบ local
- `REALTIME_WEBHOOK_TOKEN` ใช้ป้องกัน endpoint `/api/webhooks/realtime` สำหรับ event จากระบบภายนอก

## Role Password Flow

1. ผู้ใช้เลือก role ใหม่จาก sidebar
2. ระบบเปิด dialog ให้กรอกรหัสของ role นั้น
3. ถ้ารหัสถูกต้อง ระบบจึงเปลี่ยน active role
4. หากต้องการเปลี่ยนรหัส role ให้ไปหน้า Roles
5. กรอก role, เบอร์โทร และรหัสปัจจุบัน
6. ระบบส่ง OTP ผ่าน Twilio Verify
7. กรอก OTP และรหัสใหม่เพื่อบันทึก

## Realtime

ระบบ realtime ใช้ Server-Sent Events:

- `GET /api/realtime` สำหรับ subscribe event
- `POST /api/realtime/current-sale` สำหรับส่ง snapshot รายการขายปัจจุบันจากหน้า POS
- `POST /api/webhooks/realtime` สำหรับรับ event จากระบบภายนอก

Event ที่รองรับ:

- `product.changed`
- `sale.completed`
- `current-sale.updated`

หน้า Inventory จะ refresh stock เมื่อสินค้าเปลี่ยนหรือมีการ checkout ส่วนหน้า POS จะ broadcast current sale เพื่อให้แท็บหรือจออื่นเห็นรายการขายล่าสุด

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Default Language

ภาษาเริ่มต้นของระบบคือภาษาไทย ผู้ใช้สามารถเปลี่ยนเป็นอังกฤษจาก sidebar ได้ และระบบจะจำภาษาที่เลือกไว้ใน browser
