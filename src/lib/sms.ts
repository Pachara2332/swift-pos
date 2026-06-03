type SmsMessage = {
  to: string
  message: string
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
