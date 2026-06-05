'use client'

import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Building2, MapPin, Phone, Save } from 'lucide-react'
import { thaiDistricts, thaiProvinces, thaiSubDistricts } from '@/lib/thai-address'

type StoreOnboardingProps = {
  initialStore?: {
    name?: string | null
    ownerPhone?: string | null
    phone?: string | null
    address?: string | null
    provinceId?: number | null
    districtId?: number | null
    subDistrictId?: number | null
  } | null
  onComplete: () => void
}

export default function StoreOnboarding({ initialStore, onComplete }: StoreOnboardingProps) {
  const [name, setName] = useState(initialStore?.name === 'Default Store' ? '' : initialStore?.name ?? '')
  const [ownerPhone, setOwnerPhone] = useState(initialStore?.ownerPhone ?? '')
  const [phone, setPhone] = useState(initialStore?.phone ?? '')
  const [address, setAddress] = useState(initialStore?.address ?? '')
  const [provinceId, setProvinceId] = useState(initialStore?.provinceId ? String(initialStore.provinceId) : '')
  const [districtId, setDistrictId] = useState(initialStore?.districtId ? String(initialStore.districtId) : '')
  const [subDistrictId, setSubDistrictId] = useState(initialStore?.subDistrictId ? String(initialStore.subDistrictId) : '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const availableDistricts = useMemo(() => {
    const selectedProvinceId = Number(provinceId)
    return thaiDistricts.filter((district) => district.province_id === selectedProvinceId)
  }, [provinceId])

  const availableSubDistricts = useMemo(() => {
    const selectedDistrictId = Number(districtId)
    return thaiSubDistricts.filter((subDistrict) => subDistrict.district_id === selectedDistrictId)
  }, [districtId])

  const selectedSubDistrict = useMemo(() => {
    return thaiSubDistricts.find((item) => item.id === Number(subDistrictId))
  }, [subDistrictId])

  const handleProvinceChange = (value: string) => {
    setProvinceId(value)
    setDistrictId('')
    setSubDistrictId('')
  }

  const handleDistrictChange = (value: string) => {
    setDistrictId(value)
    setSubDistrictId('')
  }

  const saveStore = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/store', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          ownerPhone,
          phone,
          address,
          provinceId,
          districtId,
          subDistrictId,
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'บันทึกข้อมูลร้านไม่สำเร็จ')
      }

      onComplete()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'บันทึกข้อมูลร้านไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="store-setup-page">
      <section className="store-setup-panel">
        <div className="store-setup-heading">
          <div>
            <Building2 size={30} />
          </div>
          <div>
            <h1>ตั้งค่าร้านค้า</h1>
            <p>ข้อมูลนี้ใช้แยกร้านและใช้เบอร์เจ้าของร้านสำหรับเปลี่ยนรหัสทุกบทบาท</p>
          </div>
        </div>

        <form className="store-setup-form" onSubmit={saveStore}>
          <label className="input-group">
            <span>ชื่อร้านค้า</span>
            <input className="input-field" value={name} onChange={(event) => setName(event.target.value)} placeholder="เช่น ร้านป้าสมใจ" required />
          </label>

          <div className="store-setup-grid">
            <label className="input-group">
              <span>เบอร์เจ้าของร้าน</span>
              <div className="input-icon-field setup-input-icon">
                <Phone size={18} />
                <input className="input-field" value={ownerPhone} onChange={(event) => setOwnerPhone(event.target.value)} placeholder="+66900000000" required />
              </div>
            </label>
            <label className="input-group">
              <span>เบอร์หน้าร้าน</span>
              <input className="input-field" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+66900000000" />
            </label>
          </div>

          <label className="input-group">
            <span>ที่อยู่ร้าน</span>
            <div className="input-icon-field setup-input-icon">
              <MapPin size={18} />
              <input className="input-field" value={address} onChange={(event) => setAddress(event.target.value)} placeholder="เลขที่ อาคาร ถนน" />
            </div>
          </label>

          <div className="store-setup-grid three-columns">
            <label className="input-group">
              <span>จังหวัด</span>
              <select className="input-field" value={provinceId} onChange={(event) => handleProvinceChange(event.target.value)} required>
                <option value="">เลือกจังหวัด</option>
                {thaiProvinces.map((province) => (
                  <option key={province.id} value={province.id}>{province.name_th}</option>
                ))}
              </select>
            </label>
            <label className="input-group">
              <span>อำเภอ/เขต</span>
              <select className="input-field" value={districtId} onChange={(event) => handleDistrictChange(event.target.value)} disabled={!provinceId} required>
                <option value="">เลือกอำเภอ</option>
                {availableDistricts.map((district) => (
                  <option key={district.id} value={district.id}>{district.name_th}</option>
                ))}
              </select>
            </label>
            <label className="input-group">
              <span>ตำบล/แขวง</span>
              <select className="input-field" value={subDistrictId} onChange={(event) => setSubDistrictId(event.target.value)} disabled={!districtId} required>
                <option value="">เลือกตำบล</option>
                {availableSubDistricts.map((subDistrict) => (
                  <option key={subDistrict.id} value={subDistrict.id}>{subDistrict.name_th}</option>
                ))}
              </select>
            </label>
          </div>

          {selectedSubDistrict && (
            <div className="zip-preview">
              <span>รหัสไปรษณีย์</span>
              <strong>{selectedSubDistrict.zip_code}</strong>
            </div>
          )}

          {error && <p className="form-error">{error}</p>}

          <button className="btn btn-primary store-setup-submit" type="submit" disabled={loading}>
            <Save size={18} />
            {loading ? 'กำลังบันทึก...' : 'บันทึกและเริ่มใช้งาน'}
          </button>
        </form>
      </section>
    </div>
  )
}
