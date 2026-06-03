type SmsMessage = {
  to: string
  message: string
}

type RolePasswordOtpMessage = {
  to: string
  role: string
  fallbackCode: string
}

function getTwilioConfig() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID

  if (!accountSid || !authToken || !verifyServiceSid) {
    return null
  }

  return { accountSid, authToken, verifyServiceSid }
}

export function isTwilioVerifyConfigured() {
  return getTwilioConfig() !== null
}

function getTwilioAuthHeader(accountSid: string, authToken: string) {
  return `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`
}

export async function sendSms({ to, message }: SmsMessage) {
  if (process.env.SMS_WEBHOOK_URL) {
    const response = await fetch(process.env.SMS_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.SMS_WEBHOOK_TOKEN ? { Authorization: `Bearer ${process.env.SMS_WEBHOOK_TOKEN}` } : {}),
      },
      body: JSON.stringify({ to, message }),
    })

    if (!response.ok) {
      throw new Error('SMS provider rejected the message')
    }

    return
  }

  console.log(`[Swift POS SMS mock] ${to}: ${message}`)
}

export async function sendRolePasswordOtp({ to, role, fallbackCode }: RolePasswordOtpMessage) {
  const twilio = getTwilioConfig()

  if (twilio) {
    const response = await fetch(
      `https://verify.twilio.com/v2/Services/${twilio.verifyServiceSid}/Verifications`,
      {
        method: 'POST',
        headers: {
          Authorization: getTwilioAuthHeader(twilio.accountSid, twilio.authToken),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: to,
          Channel: 'sms',
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Twilio verification request failed:', errorText)
      throw new Error('Twilio could not send the OTP')
    }

    return
  }

  await sendSms({
    to,
    message: `Swift POS ${role} password reset code: ${fallbackCode}. This code expires in 10 minutes.`,
  })
}

export async function verifyRolePasswordOtp(to: string, code: string) {
  const twilio = getTwilioConfig()

  if (!twilio) {
    return true
  }

  const response = await fetch(
    `https://verify.twilio.com/v2/Services/${twilio.verifyServiceSid}/VerificationCheck`,
    {
      method: 'POST',
      headers: {
        Authorization: getTwilioAuthHeader(twilio.accountSid, twilio.authToken),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: to,
        Code: code,
      }),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Twilio verification check failed:', errorText)
    return false
  }

  const result = (await response.json()) as { status?: string }
  return result.status === 'approved'
}
