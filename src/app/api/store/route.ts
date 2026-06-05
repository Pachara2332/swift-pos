import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidE164PhoneNumber, normalizePhoneNumber } from '@/lib/phone'
import { ensureStore, getRequestStoreId } from '@/lib/store-scope'
import { getThaiAddressNames } from '@/lib/thai-address'

export async function GET(request: Request) {
  try {
    const storeId = await getRequestStoreId(request)
    const store = await prisma.store.findUnique({ where: { id: storeId } })
    return NextResponse.json(store)
  } catch (error) {
    console.error('Store load error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const storeId = await getRequestStoreId(request)
    await ensureStore(storeId)

    const body = await request.json()
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const ownerPhone = normalizePhoneNumber(String(body.ownerPhone ?? ''))
    const phone = body.phone ? normalizePhoneNumber(String(body.phone)) : null
    const address = typeof body.address === 'string' ? body.address.trim() : ''
    const provinceId = Number(body.provinceId)
    const districtId = Number(body.districtId)
    const subDistrictId = Number(body.subDistrictId)
    const addressNames = getThaiAddressNames(provinceId, districtId, subDistrictId)

    if (!name) {
      return NextResponse.json({ error: 'Store name is required' }, { status: 400 })
    }

    if (!isValidE164PhoneNumber(ownerPhone)) {
      return NextResponse.json({ error: 'Owner phone must be a valid E.164 number' }, { status: 400 })
    }

    if (phone && !isValidE164PhoneNumber(phone)) {
      return NextResponse.json({ error: 'Store phone must be a valid E.164 number' }, { status: 400 })
    }

    if (!addressNames) {
      return NextResponse.json({ error: 'Province, district, and sub-district are invalid' }, { status: 400 })
    }

    const store = await prisma.store.update({
      where: { id: storeId },
      data: {
        name,
        ownerPhone,
        phone,
        address,
        provinceId,
        provinceName: addressNames.provinceName,
        districtId,
        districtName: addressNames.districtName,
        subDistrictId,
        subDistrictName: addressNames.subDistrictName,
        zipCode: addressNames.zipCode,
      },
    })

    return NextResponse.json(store)
  } catch (error) {
    console.error('Store save error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
