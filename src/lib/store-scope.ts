import { prisma } from '@/lib/prisma'

export const DEFAULT_STORE_ID = process.env.SWIFT_POS_DEFAULT_STORE_ID ?? 'default-store'
export const DEFAULT_STORE_NAME = process.env.SWIFT_POS_DEFAULT_STORE_NAME ?? 'Default Store'

function normalizeStoreId(value: string | null) {
  const trimmed = value?.trim()
  return trimmed || DEFAULT_STORE_ID
}

export async function ensureStore(storeId = DEFAULT_STORE_ID) {
  return prisma.store.upsert({
    where: { id: storeId },
    update: {},
    create: {
      id: storeId,
      name: storeId === DEFAULT_STORE_ID ? DEFAULT_STORE_NAME : storeId,
    },
  })
}

export async function getRequestStoreId(request: Request) {
  const storeId = normalizeStoreId(request.headers.get('x-store-id'))
  await ensureStore(storeId)
  return storeId
}
