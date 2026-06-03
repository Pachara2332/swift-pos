'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import { KeyRound, MessageSquareText, Save } from 'lucide-react'
import { storeRoles, type StoreRole } from '@/lib/role-constants'

type Step = 'request' | 'confirm'

export default function RoleSecurityPanel() {
  const [role, setRole] = useState<StoreRole>('Admin')
  const [phone, setPhone] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [step, setStep] = useState<Step>('request')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const requestOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch('/api/roles/password/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, phone, currentPassword }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Unable to send OTP')
      }

      setStep('confirm')
      setMessage('OTP sent. Check SMS or the development server console.')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const confirmPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch('/api/roles/password/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, phone, otp, newPassword }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Unable to change password')
      }

      setCurrentPassword('')
      setOtp('')
      setNewPassword('')
      setStep('request')
      setMessage(`${role} password updated`)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to change password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{ width: 38, height: 38, borderRadius: 'var(--radius-sm)', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <KeyRound size={20} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Role Passwords</h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>Use SMS OTP before changing each role password</p>
        </div>
      </div>

      <form onSubmit={step === 'request' ? requestOtp : confirmPassword} style={{ display: 'grid', gap: '1rem' }}>
        <div className="roles-security-grid">
          <label className="input-group" style={{ marginBottom: 0 }}>
            <span>Role</span>
            <select className="input-field" value={role} onChange={(event) => setRole(event.target.value as StoreRole)}>
              {storeRoles.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="input-group" style={{ marginBottom: 0 }}>
            <span>Phone</span>
            <input className="input-field" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+66123456789" />
          </label>
        </div>

        {step === 'request' ? (
          <label className="input-group" style={{ marginBottom: 0 }}>
            <span>Current Password</span>
            <input className="input-field" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
          </label>
        ) : (
          <div className="roles-security-grid">
            <label className="input-group" style={{ marginBottom: 0 }}>
              <span>OTP</span>
              <input className="input-field" inputMode="numeric" value={otp} onChange={(event) => setOtp(event.target.value)} />
            </label>
            <label className="input-group" style={{ marginBottom: 0 }}>
              <span>New Password</span>
              <input className="input-field" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
            </label>
          </div>
        )}

        {error && <p style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{error}</p>}
        {message && <p style={{ color: 'var(--success)', fontSize: '0.85rem' }}>{message}</p>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.7rem', flexWrap: 'wrap' }}>
          {step === 'confirm' && (
            <button type="button" className="btn btn-quiet" onClick={() => setStep('request')}>Back</button>
          )}
          <button className="btn btn-primary" disabled={loading} type="submit">
            {step === 'request' ? <MessageSquareText size={16} /> : <Save size={16} />}
            {loading ? 'Working...' : step === 'request' ? 'Send OTP' : 'Change Password'}
          </button>
        </div>
      </form>
    </section>
  )
}
