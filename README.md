# Swift POS

Swift POS คือระบบขายหน้าร้านสำหรับร้านค้าขนาดเล็กถึงกลาง สร้างด้วย Next.js, React, Prisma และ PostgreSQL/Neon รองรับการขายด้วยบาร์โค้ด การขายตามน้ำหนัก เพิ่มสินค้าเร็ว สมุดลูกหนี้ พักบิล ทำงานออฟไลน์บางส่วน และแดชบอร์ดสรุปยอดขาย

## Features

- POS หลักสำหรับสแกน/พิมพ์บาร์โค้ด ค้นหาสินค้า และขายด่วน
- เมนูขายสินค้าแบบแยกโหมด: ขายหน้าร้าน, ชั่งกิโล, เพิ่มสินค้าเร็ว, สมุดลูกหนี้
- ตะกร้าขายพร้อมรับเงินสด คำนวณเงินทอน พักบิล และพิมพ์ใบเสร็จ
- เพิ่มสินค้าใหม่และดึงข้อมูลตั้งต้นจาก Open Food Facts เมื่อเจอบาร์โค้ดที่ยังไม่มีในระบบ
- จัดการสต็อก ดูของใกล้หมด และสร้างบาร์โค้ด
- Dashboard สำหรับยอดขาย รายการขาย สินค้าขายดี และสต็อกต่ำ
- Role access สำหรับ Admin, Manager และ Cashier พร้อม flow เปลี่ยนรหัสด้วย OTP/SMS
- Realtime ผ่าน Server-Sent Events สำหรับ stock/current sale updates
- รองรับภาษาไทยและอังกฤษ

## Tech Stack

- Next.js 16.2
- React 19
- TypeScript
- Zustand
- Prisma 7
- PostgreSQL / Neon
- Chart.js
- html5-qrcode
- Twilio Verify

## Project Structure

```text
src/app/                      App Router pages and API routes
src/components/AppShell.tsx   Main sidebar, language switcher, role switcher
src/components/pos/           POS UI panels and columns
src/lib/pos/store.ts          Zustand store for POS workflow state
src/lib/pos/usePosController.ts
                               POS orchestration, handlers, computed data
src/lib/pos/storage.ts        localStorage helpers for held bills/offline data
src/lib/i18n.tsx              Thai/English dictionary and provider
src/lib/role-context.tsx      Active role context
prisma/schema.prisma          Database schema
```

## POS Architecture

หน้า POS แบ่งหน้าที่แบบนี้:

- `src/app/page.tsx` เป็น entry บาง ๆ ของหน้า `/`
- `POSPageContent.tsx` อ่าน query `tool` แล้ว render layout
- `usePosController.ts` รวม workflow หลัก เช่น scan, checkout, debt ledger, offline sync, receipt printing
- `store.ts` ใช้ Zustand เก็บ state กลางของ POS เช่น cart, products, held bills, customers, notifications และ form state

โหมด POS ใช้ query parameter:

```text
/                         ขายหน้าร้าน
/?tool=weight             ชั่งกิโล
/?tool=quick-product      เพิ่มสินค้าเร็ว
/?tool=debt               สมุดลูกหนี้
```

## Getting Started

ติดตั้ง dependencies:

```bash
npm install
```

สร้าง Prisma client:

```bash
npx prisma generate
```

ซิงก์ schema เข้าฐานข้อมูล:

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

สร้างไฟล์ `.env` หรือ `.env.local` แล้วกำหนดค่าหลัก:

```env
DATABASE_URL="postgresql://..."

TWILIO_ACCOUNT_SID="ACxxxxxxxx"
TWILIO_AUTH_TOKEN="xxxxxxxx"
TWILIO_VERIFY_SERVICE_SID="VAxxxxxxxx"

SWIFT_POS_DEFAULT_ROLE_PASSWORD="123456"
REALTIME_WEBHOOK_TOKEN="optional-webhook-token"
```

หมายเหตุ:

- `DATABASE_URL` จำเป็นสำหรับ Prisma และ API ที่อ่าน/เขียนฐานข้อมูล
- `SWIFT_POS_DEFAULT_ROLE_PASSWORD` คือรหัสเริ่มต้นของ role ที่ยังไม่เคยตั้งในฐานข้อมูล
- Twilio ใช้สำหรับ OTP เปลี่ยนรหัส role ถ้าไม่ได้ตั้งค่าครบ ระบบจะ fallback สำหรับ local test
- `REALTIME_WEBHOOK_TOKEN` ใช้ป้องกัน endpoint `/api/webhooks/realtime`

## Scripts

```bash
npm run dev      # start development server
npm run build    # prisma generate + next build
npm run start    # start production server
npm run lint     # run eslint
```

## Realtime

ระบบ realtime ใช้ Server-Sent Events:

- `GET /api/realtime` สำหรับ subscribe events
- `POST /api/realtime/current-sale` สำหรับส่ง snapshot รายการขายปัจจุบันจากหน้า POS
- `POST /api/webhooks/realtime` สำหรับรับ event จากระบบภายนอก

Event ที่รองรับ:

- `product.changed`
- `sale.completed`
- `current-sale.updated`

## Local Persistence

ข้อมูลบางส่วนของ POS ถูกเก็บใน browser `localStorage` เพื่อให้ใช้งานต่อได้แม้ refresh หน้า:

- `swift-pos-held-bills`
- `swift-pos-debt-customers`
- `swift-pos-debt-entries`
- `swift-pos-offline-sales`
- `swift-pos-completed-sales`
- `swift-pos-language`
- `swift-pos-role`

## Role Flow

1. ผู้ใช้เลือก role จาก sidebar
2. ระบบให้กรอกรหัสของ role นั้น
3. ถ้ารหัสถูกต้องจะเปลี่ยน active role
4. การเปลี่ยนรหัส role ทำที่หน้า Roles
5. ระบบส่ง OTP ผ่าน Twilio Verify หรือ mock flow สำหรับ local test

## Development Notes

- โปรเจกต์นี้ใช้ Next.js 16 ซึ่งมีรายละเอียดต่างจาก Next.js เวอร์ชันเก่า อ่านเอกสารใน `node_modules/next/dist/docs/` ก่อนแก้ convention ของ App Router
- อย่าเก็บ secret จริงลง repo
- POS state ใช้ Zustand แต่ข้อมูลถาวรฝั่ง client ยัง sync ผ่าน helper ใน `src/lib/pos/storage.ts`
- ก่อนส่งงานควรรัน `npm run lint` และ `npx tsc --noEmit`
