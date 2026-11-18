import type { Currency } from './types'

export interface ChargeRequest {
  amount: number
  currency: Currency
  method: 'card' | 'promptpay'
  cardNumber?: string
  simulateFailure?: boolean
}

export interface ChargeResult {
  ok: boolean
  reference: string
  detail: string
  error?: 'declined'
}

/**
 * Swap this implementation for Stripe / Omise later — the rest of the app
 * only talks to this interface.
 */
export interface PaymentProvider {
  name: string
  charge(req: ChargeRequest): Promise<ChargeResult>
}

export const DECLINED_TEST_CARD = '4000000000000002'

export const demoPaymentProvider: PaymentProvider = {
  name: 'demo',
  async charge(req) {
    await new Promise((r) => setTimeout(r, 1200))
    const digits = (req.cardNumber ?? '').replace(/\D/g, '')
    const reference = 'DEMO-' + Math.random().toString(36).slice(2, 10).toUpperCase()
    const detail = req.method === 'card' ? `Card •••• ${digits.slice(-4) || '0000'}` : 'PromptPay QR'
    if (req.simulateFailure || digits === DECLINED_TEST_CARD) {
      return { ok: false, reference, detail, error: 'declined' }
    }
    return { ok: true, reference, detail }
  },
}

export const paymentProvider: PaymentProvider = demoPaymentProvider
