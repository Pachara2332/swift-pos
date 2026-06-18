# Swift POS

Swift POS คือระบบขายหน้าร้านสำหรับร้านค้าขนาดเล็กถึงกลาง พัฒนาเป็นเว็บแอปด้วย Next.js, React, Prisma และ PostgreSQL/Neon จุดหลักของโปรเจกต์คือให้ร้านค้าสามารถขายของหน้าร้านได้เร็วขึ้น จัดการสต็อกได้จริง แยกสิทธิ์ผู้ใช้งานตามบทบาท รองรับบาร์โค้ด พักบิล ขายแบบออฟไลน์บางส่วน และดูยอดขาย/สต็อกผ่านแดชบอร์ด

โปรเจกต์นี้ออกแบบให้เป็น POS ที่ใช้งานจริงในร้านเล็กได้ ไม่ใช่แค่หน้าตัวอย่าง: การขายจะบันทึกผ่าน API, ตัดสต็อกในฐานข้อมูล, สมุดลูกหนี้ผูกกับบิลขายจริง และ role session ฝั่ง server เป็นตัวกำหนดสิทธิ์การเรียก API

## สารบัญ

- [ภาพรวมความสามารถ](#ภาพรวมความสามารถ)
- [Flow การใช้งานหลัก](#flow-การใช้งานหลัก)
- [สถาปัตยกรรมระบบ](#สถาปัตยกรรมระบบ)
- [โครงสร้างโปรเจกต์](#โครงสร้างโปรเจกต์)
- [ฐานข้อมูล](#ฐานข้อมูล)
- [API Routes](#api-routes)
- [Realtime และ Offline](#realtime-และ-offline)
- [Role และความปลอดภัย](#role-และความปลอดภัย)
- [การติดตั้งและรันบนเครื่อง](#การติดตั้งและรันบนเครื่อง)
- [Environment Variables](#environment-variables)
- [คำสั่งที่ใช้บ่อย](#คำสั่งที่ใช้บ่อย)
- [การตรวจสอบก่อนส่งงาน](#การตรวจสอบก่อนส่งงาน)
- [ข้อจำกัดและสิ่งที่ควรรู้](#ข้อจำกัดและสิ่งที่ควรรู้)

## ภาพรวมความสามารถ

### POS หน้าร้าน

- ขายสินค้าด้วยการสแกนหรือพิมพ์บาร์โค้ด
- ค้นหาสินค้าด้วยชื่อ หมวดหมู่ หรือบาร์โค้ด
- ปุ่มขายด่วน แยกตามหมวด เช่น ขายดี ของสด ของชำ เครื่องดื่ม
- ตะกร้าขายพร้อมเพิ่ม/ลดจำนวนสินค้า
- รับเงินสด คำนวณเงินทอน และบันทึกบิลขาย
- พิมพ์ใบเสร็จล่าสุดจาก browser print
- แสดงสถานะ realtime ของรายการขายปัจจุบัน

### โหมดขายแยกตามงาน

หน้า POS หลักใช้ query parameter เพื่อสลับเครื่องมือ:

```text
/                         ขายหน้าร้าน
/?tool=weight             ชั่งกิโล
/?tool=quick-product      เพิ่มสินค้าเร็ว
/?tool=debt               สมุดลูกหนี้
```

แต่ละโหมดมีหน้าที่ต่างกัน:

- `ขายหน้าร้าน` ใช้สแกนบาร์โค้ด ค้นหา และแตะขายด่วน
- `ชั่งกิโล` เลือกสินค้าแบบน้ำหนัก ใส่กิโล แล้วคำนวณราคาตามน้ำหนัก
- `เพิ่มสินค้าเร็ว` เพิ่มสินค้าชั่วคราว/สินค้าที่ไม่มีบาร์โค้ด แล้วใส่ตะกร้าทันที
- `สมุดลูกหนี้` สร้างลูกหนี้ บันทึกขายเชื่อ รับชำระบางส่วน และดูยอดคงค้าง

### สินค้าและสต็อก

- เพิ่มสินค้าใหม่พร้อมบาร์โค้ด ชื่อ แบรนด์ หมวดหมู่ ราคาทุน ราคาขาย สต็อก และเกณฑ์สต็อกต่ำ
- หน้า `/products` แสดงรายการสินค้า ค้นหา กรองหมวด และเรียงข้อมูลได้
- กดดูรายละเอียดสินค้าได้จากหน้า stock
- รายละเอียดสินค้าแสดงชื่อ จำนวนคงเหลือ ราคา บาร์โค้ด แบรนด์ หมวดหมู่ วันที่เพิ่ม วันที่อัปเดตล่าสุด และภาพบาร์โค้ด Code 128
- สินค้าใกล้หมดและสินค้าหมดจะแสดง badge แยกสถานะ
- หน้า `/barcodes` ใช้สร้างภาพบาร์โค้ดสำหรับปริ้นแปะสินค้า

### แดชบอร์ด

- ดูรายได้วันนี้ จำนวนบิล ยอดเฉลี่ยต่อบิล และจำนวนสินค้าใกล้หมด
- กราฟแนวโน้มรายได้
- รายการสินค้าขายดี
- รายการสินค้าที่ต้องดูแลเพราะสต็อกต่ำ
- export ข้อมูลวิเคราะห์บางส่วนด้วย `xlsx`

### พักบิลและ Offline Sync

- `พักบิล` ใช้เก็บตะกร้าที่ยังไม่ได้ชำระไว้ชั่วคราว แล้วดึงกลับมาขายต่อได้
- `บิลรอ Sync` ใช้กับบิลที่ชำระแล้วตอน offline หรือส่ง server ไม่สำเร็จ
- เมื่อกลับมาออนไลน์ ระบบจะพยายาม sync บิลค้างให้อัตโนมัติ
- ปุ่ม `Sync` ในกล่องบิลรอ Sync กดเช็คได้แม้ไม่มีบิล และแสดง loading ระหว่างเช็ค/ส่งข้อมูล

### Store และ Role

- มีขั้นตอนตั้งค่าร้านครั้งแรก เช่น ชื่อร้าน เบอร์เจ้าของร้าน เบอร์หน้าร้าน และที่อยู่ไทย
- รองรับข้อมูลจังหวัด อำเภอ ตำบล และรหัสไปรษณีย์จากชุดข้อมูลไทยใน repo
- แยกบทบาท `Admin`, `Manager`, `Cashier`
- role session ถูกเซ็นและเก็บใน HTTP-only cookie
- API สำคัญตรวจสิทธิ์จาก server session ไม่ใช่แค่ซ่อนปุ่มใน UI
- เปลี่ยนรหัสบทบาทผ่าน flow OTP ไปยังเบอร์เจ้าของร้าน

## Flow การใช้งานหลัก

### เปิดร้านครั้งแรก

1. เข้าเว็บที่ `/`
2. ระบบโหลดข้อมูลร้านจาก `/api/store`
3. ถ้าร้านยังไม่พร้อม จะเห็นหน้า `StoreOnboarding`
4. กรอกชื่อร้าน เบอร์เจ้าของร้าน เบอร์หน้าร้าน และที่อยู่
5. บันทึกแล้วเริ่มใช้งาน POS

### Login ตามบทบาท

1. เลือกบทบาทจาก sidebar
2. กดปลดล็อกหรือเปลี่ยนสิทธิ์
3. กรอกรหัสของบทบาท
4. ระบบเรียก `/api/roles/auth`
5. ถ้าถูกต้อง ระบบตั้ง cookie `swift-pos-role-session`
6. API หลังจากนั้นจะอนุญาตตามสิทธิ์ของบทบาท

### ขายด้วยบาร์โค้ด

1. สแกนหรือพิมพ์บาร์โค้ด
2. controller ค้นหาจากสินค้าที่โหลดไว้ใน client ก่อน
3. ถ้าไม่เจอ จะเรียก `/api/products/{barcode}` เพื่อค้นในร้าน
4. ถ้าเจอสินค้า local จะเพิ่มลงตะกร้าทันที
5. ถ้าไม่เจอ จะแจ้งว่าไม่พบสินค้าในสต็อกร้าน

หมายเหตุ: cashier scan flow ปัจจุบันเน้นสินค้าในร้าน ไม่ redirect ไปเพิ่มสินค้าหรือดึง external lookup อัตโนมัติ

### เพิ่มสินค้าใหม่จากบาร์โค้ด

1. ไปที่ `/products/add`
2. กรอกบาร์โค้ดและรายละเอียดสินค้า
3. บันทึกผ่าน `POST /api/products`
4. ระบบสร้างหรืออัปเดตสินค้าที่มีบาร์โค้ดซ้ำในร้านเดียวกัน
5. ส่ง event `product.changed` ให้ realtime subscriber

### ขายเงินสด

1. เพิ่มสินค้าเข้าตะกร้า
2. ใส่เงินที่รับ หรือกดปุ่มเงินด่วน
3. กดชำระเงิน
4. ระบบเรียก `POST /api/sales`
5. API สร้าง Sale, SaleItem และตัดสต็อกใน transaction เดียว
6. UI เก็บใบเสร็จล่าสุดและรายการขายล่าสุดไว้ฝั่ง client

### ขายเชื่อและลูกหนี้

1. ไปที่ `/?tool=debt`
2. เลือกลูกค้า หรือเพิ่มลูกค้าใหม่ผ่าน `/api/debt/customers`
3. เพิ่มสินค้าลงตะกร้า
4. บันทึกขายเชื่อ
5. `POST /api/sales` จะสร้าง Sale และ DebtEntry ใน transaction เดียว
6. รับชำระบางส่วนผ่าน `/api/debt/entries`

### พักบิล

1. มีสินค้าอยู่ในตะกร้า
2. กด `พักบิล`
3. ระบบเก็บตะกร้าลง `localStorage` key `swift-pos-held-bills`
4. ตะกร้าว่าง เพื่อขายคนถัดไป
5. ในกล่อง `บิลที่พักไว้` กด `ดึงกลับ` เพื่อเอาตะกร้ากลับมา

พักบิลยังไม่ใช่ยอดขาย และยังไม่ตัดสต็อกจนกว่าจะชำระเงินจริง

### Offline sale และ Sync

1. ถ้า checkout แล้ว browser offline หรือส่ง `/api/sales` ไม่สำเร็จ
2. ระบบสร้าง offline receipt และเก็บ payload ลง `swift-pos-offline-sales`
3. บิลจะแสดงในกล่อง `บิลรอ Sync`
4. เมื่อ status กลับเป็น live ระบบจะพยายาม sync อัตโนมัติ
5. ผู้ใช้กด `Sync` เพื่อเช็ค/ส่งซ้ำได้
6. เมื่อ sync สำเร็จ บิลจะถูกลบออกจาก queue

## สถาปัตยกรรมระบบ

Swift POS ใช้ Next.js App Router โดยแบ่งชั้นหลักดังนี้:

```text
Browser UI
  -> React Client Components
  -> Zustand POS store
  -> Next.js Route Handlers
  -> Prisma Client + Neon adapter
  -> PostgreSQL / Neon
```

ส่วนสำคัญ:

- `src/app/page.tsx` เป็น entry ของหน้า POS
- `src/components/pos/POSPageContent.tsx` อ่าน query `tool` แล้วเลือกโหมดการขาย
- `src/lib/pos/usePosController.ts` เป็น controller หลักของ POS รวม logic scan, cart, checkout, debt, offline sync, receipt และ realtime
- `src/lib/pos/store.ts` ใช้ Zustand เก็บ state กลางของ POS
- `src/lib/pos/storage.ts` ช่วยอ่าน/เขียนข้อมูล localStorage
- `src/app/api/*` เป็น route handlers สำหรับข้อมูลถาวรและ workflow สำคัญ
- `src/lib/prisma.ts` เป็น runtime Prisma client factory ใช้ `PrismaNeon`
- `prisma.config.ts` เป็น config สำหรับ Prisma CLI และโหลด `DATABASE_URL`

## โครงสร้างโปรเจกต์

```text
.
├─ prisma/
│  └─ schema.prisma                 schema ฐานข้อมูลหลัก
├─ public/                           static assets จาก Next starter
├─ src/
│  ├─ app/
│  │  ├─ api/                        Route handlers ฝั่ง server
│  │  ├─ barcodes/                   หน้า generate barcode label
│  │  ├─ dashboard/                  หน้า dashboard
│  │  ├─ products/                   หน้า stock และเพิ่มสินค้า
│  │  ├─ roles/                      หน้าจัดการรหัสบทบาท
│  │  ├─ globals.css                 style หลักของแอป
│  │  ├─ layout.tsx                  root layout
│  │  └─ page.tsx                    หน้า POS หลัก
│  ├─ components/
│  │  ├─ AppShell.tsx                shell, sidebar, language, role switcher
│  │  ├─ StoreOnboarding.tsx         ตั้งค่าร้านครั้งแรก
│  │  ├─ BarcodeScanner.tsx          camera/upload barcode scanner
│  │  └─ pos/                        panels ของหน้า POS
│  ├─ data/
│  │  ├─ thai-provinces.json         ข้อมูลจังหวัด
│  │  ├─ thai-districts.json         ข้อมูลอำเภอ
│  │  └─ thai-sub-districts.json     ข้อมูลตำบลและรหัสไปรษณีย์
│  ├─ generated/prisma/              Prisma generated client
│  └─ lib/
│     ├─ auth.ts                     signed role session cookie
│     ├─ barcode-label.ts            สร้าง SVG barcode Code 128
│     ├─ i18n.tsx                    ภาษาไทย/อังกฤษ
│     ├─ prisma.ts                   Prisma runtime client
│     ├─ realtime.ts                 event bus สำหรับ SSE
│     ├─ roles.ts                    hash/verify/reset role password
│     ├─ sms.ts                      Twilio Verify หรือ SMS webhook/mock
│     ├─ store-scope.ts              store id และ ensure store
│     └─ pos/                        store, controller, types, utils
├─ package.json
├─ prisma.config.ts
└─ README.md
```

## ฐานข้อมูล

ใช้ PostgreSQL ผ่าน Prisma 7 และ `@prisma/adapter-neon`

โมเดลหลัก:

- `Store` เก็บข้อมูลร้าน เบอร์เจ้าของร้าน ที่อยู่ และ relation ไปยังข้อมูลอื่น
- `Product` เก็บสินค้าแบบ store-scoped โดย unique ที่ `[storeId, barcode]`
- `Sale` เก็บบิลขาย ยอดรวม เงินที่รับ เงินทอน payment type และ customerId ถ้าเป็นขายเชื่อ
- `SaleItem` เก็บรายการสินค้าในแต่ละบิล
- `DebtCustomer` เก็บลูกหนี้ของร้าน
- `DebtEntry` เก็บรายการหนี้และรายการรับชำระ
- `RoleCredential` เก็บรหัสผ่านแต่ละบทบาทต่อร้าน
- `RolePasswordReset` เก็บ OTP reset รหัสบทบาท
- `AppUser` และ `StoreMembership` เป็นโครงสำหรับ user/membership ระดับ store

พฤติกรรมสำคัญของข้อมูล:

- สินค้าและบาร์โค้ดแยกตามร้านด้วย `storeId`
- การขายและการตัดสต็อกทำใน transaction เดียวใน `/api/sales`
- การขายเชื่อสร้าง `Sale` และ `DebtEntry` ใน transaction เดียวกัน
- ลูกหนี้และรายการหนี้อยู่ในฐานข้อมูล ไม่ใช่ localStorage
- localStorage เหลือไว้สำหรับ state ฝั่ง browser เช่นพักบิล บิลรอ sync และใบเสร็จล่าสุด

## API Routes

### Store

```text
GET   /api/store
PATCH /api/store
```

- `GET` โหลดข้อมูลร้านตาม `x-store-id` หรือ default store
- `PATCH` ใช้บันทึกข้อมูลร้าน
- ถ้าร้านยังไม่พร้อม อนุญาตให้ setup ครั้งแรกได้
- ถ้าร้านพร้อมแล้ว การแก้ร้านต้องเป็น `Admin`

### Products

```text
GET  /api/products
POST /api/products
GET  /api/products/[barcode]
```

- `GET /api/products` โหลดสินค้าของร้าน
- `POST /api/products` สร้างหรืออัปเดตสินค้า ต้องเป็น `Admin`
- `GET /api/products/[barcode]` ค้นสินค้าด้วยบาร์โค้ด
- ถ้าใส่ `?external=1` จะพยายาม lookup จาก Open Food Facts หลังไม่เจอ local product
- ถ้าไม่ใส่ `external=1` จะค้นเฉพาะสินค้าในร้าน

### Sales

```text
POST /api/sales
```

สิทธิ์: `Admin`, `Manager`, `Cashier`

ทำงานหลัก:

- ตรวจว่ามีรายการขาย
- ตรวจลูกหนี้ถ้ามี `customerId`
- สร้าง Sale และ SaleItem
- ตัด stock ของ Product
- ถ้าเป็น `paymentType=credit` จะสร้าง DebtEntry
- publish event `sale.completed`

### Debt Ledger

```text
GET  /api/debt/customers
POST /api/debt/customers
GET  /api/debt/entries
POST /api/debt/entries
```

ใช้สำหรับสมุดลูกหนี้:

- สร้างลูกค้า
- โหลดลูกค้า
- โหลด ledger entries
- บันทึกรับชำระ

### Roles

```text
POST /api/roles/auth
GET  /api/roles/session
POST /api/roles/password/request
POST /api/roles/password/confirm
```

ใช้สำหรับ:

- login ตามบทบาท
- อ่าน session ปัจจุบัน
- ขอ OTP เพื่อเปลี่ยนรหัสบทบาท
- ยืนยัน OTP และตั้งรหัสใหม่

### Realtime

```text
GET  /api/realtime
POST /api/realtime/current-sale
POST /api/webhooks/realtime
```

รองรับ event:

- `product.changed`
- `sale.completed`
- `current-sale.updated`

## Realtime และ Offline

### Realtime

ระบบ realtime ใช้ Server-Sent Events ผ่าน `/api/realtime`

ใช้เพื่อ:

- refresh stock เมื่อสินค้าเปลี่ยน
- refresh stock เมื่อขายสำเร็จ
- แสดงรายการขายปัจจุบันระหว่าง session
- แจ้งสถานะ live/offline ใน UI

### Offline และ localStorage

ข้อมูลที่ยังเก็บใน browser:

```text
swift-pos-held-bills        บิลที่พักไว้ ยังไม่ชำระ
swift-pos-offline-sales     บิลที่ชำระแล้วแต่ยังส่ง server ไม่สำเร็จ
swift-pos-completed-sales   ประวัติใบเสร็จล่าสุดในเครื่อง
swift-pos-language          ภาษาที่เลือก
swift-pos-role              role ล่าสุดสำหรับ UI hint เท่านั้น
```

ข้อมูลที่ไม่ควรถือว่าเป็น source of truth:

- role จริงของ API ไม่ได้เชื่อ localStorage แต่เชื่อ signed cookie
- debt/customer จริงอยู่ในฐานข้อมูล
- stock จริงอยู่ในฐานข้อมูล

## Role และความปลอดภัย

บทบาทหลัก:

- `Admin` จัดการร้าน สินค้า role และดูข้อมูลทั้งหมด
- `Manager` ใช้งานงานหลังร้าน/รายงาน/ขายบางส่วน
- `Cashier` ใช้ขายหน้าร้านและบันทึกบิล

ระบบ session:

- เมื่อ login สำเร็จ API ตั้ง cookie `swift-pos-role-session`
- cookie เป็น HTTP-only และ signed ด้วย HMAC
- อายุ session ประมาณ 10 ชั่วโมง
- `requireRole()` ใน `src/lib/auth.ts` ใช้ตรวจสิทธิ์ใน route handlers

รหัสบทบาท:

- เก็บเป็น hash ผ่าน helper ใน `src/lib/roles.ts`
- ถ้าบทบาทยังไม่มี credential จะ fallback ไปที่ `SWIFT_POS_DEFAULT_ROLE_PASSWORD`
- การเปลี่ยนรหัสใช้เบอร์เจ้าของร้าน (`Store.ownerPhone`) เพื่อรับ OTP
- ถ้ามี Twilio Verify config จะใช้ Twilio
- ถ้าไม่มี Twilio จะ fallback ไปที่ SMS webhook/mock ตาม config

## Tech Stack

- Next.js 16.2.7 App Router
- React 19.2.4
- TypeScript
- Zustand 5
- Prisma 7.8
- PostgreSQL / Neon
- `@prisma/adapter-neon`
- Chart.js และ react-chartjs-2
- html5-qrcode
- lucide-react
- xlsx

## การติดตั้งและรันบนเครื่อง

### 1. ติดตั้ง dependencies

```bash
npm install
```

### 2. ตั้งค่า environment

สร้าง `.env` หรือ `.env.local`

```env
DATABASE_URL="postgresql://..."
SWIFT_POS_DEFAULT_ROLE_PASSWORD="123456"
SWIFT_POS_SESSION_SECRET="change-this-in-production"
```

ถ้าใช้ OTP จริง ให้เพิ่ม Twilio หรือ SMS webhook ตามหัวข้อ environment ด้านล่าง

### 3. สร้าง Prisma client

```bash
npx prisma generate
```

### 4. ซิงก์ schema เข้าฐานข้อมูล

```bash
npx prisma db push
```

### 5. รัน dev server

```bash
npm run dev
```

เปิด:

```text
http://localhost:3000
```

## Environment Variables

### จำเป็น

```env
DATABASE_URL="postgresql://..."
```

ใช้ทั้ง runtime Prisma client และ Prisma CLI

### แนะนำสำหรับ role/session

```env
SWIFT_POS_DEFAULT_ROLE_PASSWORD="123456"
SWIFT_POS_SESSION_SECRET="long-random-secret"
SWIFT_POS_DEFAULT_STORE_ID="default-store"
SWIFT_POS_DEFAULT_STORE_NAME="Default Store"
```

คำอธิบาย:

- `SWIFT_POS_DEFAULT_ROLE_PASSWORD` รหัสเริ่มต้นของบทบาทที่ยังไม่มี credential ใน DB
- `SWIFT_POS_SESSION_SECRET` secret สำหรับเซ็น role session cookie
- `SWIFT_POS_DEFAULT_STORE_ID` store id เริ่มต้นถ้า request ไม่มี `x-store-id`
- `SWIFT_POS_DEFAULT_STORE_NAME` ชื่อร้าน default ตอน ensure store

### OTP / SMS

ใช้ Twilio Verify:

```env
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="..."
TWILIO_VERIFY_SERVICE_SID="VA..."
```

หรือใช้ webhook:

```env
SMS_WEBHOOK_URL="https://example.com/sms"
SMS_WEBHOOK_TOKEN="optional-token"
```

ถ้าไม่ตั้งค่า ระบบจะ log mock message ใน server console

### Realtime webhook

```env
REALTIME_WEBHOOK_TOKEN="optional-token"
```

ใช้ป้องกัน `/api/webhooks/realtime`

## คำสั่งที่ใช้บ่อย

```bash
npm run dev      # รัน development server
npm run build    # prisma generate + next build
npm run start    # รัน production server หลัง build
npm run lint     # ตรวจ ESLint
```

บน Windows ถ้า PowerShell มีปัญหากับ npm script ให้ใช้:

```bash
cmd /c npm run dev
cmd /c npm run build
cmd /c npm run lint
```

## การตรวจสอบก่อนส่งงาน

ควรรัน:

```bash
cmd /c npm run lint
cmd /c npm run build
```

เหตุผล:

- `lint` จับปัญหา React/TypeScript/Next ESLint
- `build` จะรัน `prisma generate` และ `next build`
- build ช่วยยืนยันว่า Prisma generated client, Next 16, Turbopack และ route/page ทั้งหมด compile ผ่าน

ถ้าต้องพิสูจน์ flow ขายจริง ให้ทดสอบอย่างน้อย:

1. login role ผ่าน `/api/roles/auth`
2. ค้นสินค้า `/api/products/{barcode}`
3. checkout ผ่าน `/api/sales`
4. อ่านสินค้าซ้ำเพื่อยืนยันว่า stock ลด
5. ถ้าเป็นขายเชื่อ ตรวจ `DebtEntry` ด้วย

## Deployment Notes

### Vercel / Production

- ต้องมี `DATABASE_URL`
- build script ปัจจุบันคือ `prisma generate && next build`
- Prisma client ถูก generate ไปที่ `src/generated/prisma`
- runtime ใช้ `src/lib/prisma.ts` กับ `PrismaNeon`
- ควรตั้ง `SWIFT_POS_SESSION_SECRET` จริงใน production
- ถ้าใช้ OTP จริง ต้องตั้ง Twilio Verify หรือ SMS provider

### Database

โปรเจกต์นี้ใช้ `prisma db push` ได้สำหรับ environment ที่ยังไม่ต้องการ migration history เต็มรูปแบบ แต่ถ้าจะใช้ production จริงระยะยาว ควรจัดการ migration อย่างเป็นระบบ

## ข้อจำกัดและสิ่งที่ควรรู้

- ระบบ offline เป็น client-side queue ผ่าน localStorage ไม่ใช่ service worker เต็มรูปแบบ
- ถ้า offline sale sync ซ้ำหลังสถานะข้อมูลฝั่ง server เปลี่ยนมาก อาจต้องมี duplicate protection เพิ่มในอนาคต
- `current-sale.updated` เป็น realtime snapshot เพื่อดูรายการขายสด ไม่ใช่ transaction ถาวร
- Open Food Facts lookup จะทำเฉพาะเมื่อเรียก `/api/products/[barcode]?external=1`
- การสแกนขายหน้าร้านปัจจุบันค้นสินค้า local เป็นหลัก เพื่อไม่ให้ cashier ถูกพาออกจาก flow ขาย
- `AppUser` และ `StoreMembership` มี schema แล้ว แต่ flow user account เต็มรูปแบบยังไม่ได้เป็น surface หลักของ UI
- Thai/English i18n อยู่ใน `src/lib/i18n.tsx` แต่หลาย component POS ใหม่ยังมีข้อความไทย inline เพื่อให้ flow หน้าร้านอ่านง่ายก่อน

## สำหรับคนที่จะพัฒนาต่อ

- อ่าน `AGENTS.md` ก่อนแก้โค้ด Next.js เพราะโปรเจกต์ใช้ Next.js 16 และต้องอ้างอิง docs ใน `node_modules/next/dist/docs/`
- ถ้าจะแก้ flow POS ให้เริ่มที่ `src/lib/pos/usePosController.ts`
- ถ้าจะแก้ UI เฉพาะ panel ให้ดู `src/components/pos/`
- ถ้าจะแก้สิทธิ์ API ให้ดู `src/lib/auth.ts`, `src/lib/roles.ts`, และ route handler ที่เรียก `requireRole`
- ถ้าจะแก้ฐานข้อมูล ให้ดู `prisma/schema.prisma`, `src/lib/prisma.ts`, และ route ที่อ่าน/เขียน model นั้นจริง
- อย่าพึ่ง README อย่างเดียวถ้าจะยืนยัน behavior ให้เช็ค source ปัจจุบันก่อนเสมอ
