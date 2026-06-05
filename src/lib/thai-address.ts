import provinces from '@/data/thai-provinces.json'
import districts from '@/data/thai-districts.json'
import subDistricts from '@/data/thai-sub-districts.json'

export type ThaiProvince = {
  id: number
  name_th: string
  name_en: string
  geography_id: number
}

export type ThaiDistrict = {
  id: number
  name_th: string
  name_en: string
  province_id: number
}

export type ThaiSubDistrict = {
  id: number
  zip_code: number
  name_th: string
  name_en: string
  district_id: number
}

export const thaiProvinces = provinces as ThaiProvince[]
export const thaiDistricts = districts as ThaiDistrict[]
export const thaiSubDistricts = subDistricts as ThaiSubDistrict[]

export function getThaiAddressNames(provinceId: number, districtId: number, subDistrictId: number) {
  const province = thaiProvinces.find((item) => item.id === provinceId)
  const district = thaiDistricts.find((item) => item.id === districtId && item.province_id === provinceId)
  const subDistrict = thaiSubDistricts.find((item) => item.id === subDistrictId && item.district_id === districtId)

  if (!province || !district || !subDistrict) return null

  return {
    provinceName: province.name_th,
    districtName: district.name_th,
    subDistrictName: subDistrict.name_th,
    zipCode: String(subDistrict.zip_code),
  }
}
