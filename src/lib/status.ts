// Order progress. Demo orders move forward with the clock so the
// tracking page can be shown live; a real backend would store each step instead.
import type { Order } from './types'

export interface Step {
  id: string
  label: string
  detail: string
  at: number // ms timestamp the step is reached
}

const SEC = 1000
const DAY = 86400 * SEC

export function orderSteps(o: Order): Step[] {
  const t0 = new Date(o.createdAt).getTime()
  const unit = o.timeScale === 'demo' ? SEC : DAY / 30 // real: spread over a few days
  return [
    { id: 'placed', label: 'รับคำสั่งซื้อ', detail: 'ชำระเงินเรียบร้อย', at: t0 },
    { id: 'packed', label: 'แพ็กสินค้า', detail: 'หยิบสินค้าตามไซส์ เช็กความเรียบร้อย', at: t0 + 30 * unit },
    { id: 'shipped', label: 'กำลังจัดส่ง', detail: 'ส่งกับ Flash Express รวมในราคาแล้ว', at: t0 + 60 * unit },
    {
      id: 'done',
      label: 'ส่งถึงแล้ว',
      detail: 'ขอบคุณที่อุดหนุน',
      at: t0 + 120 * unit,
    },
  ]
}

/** Steps of the one free size exchange. Demo exchanges move with the clock like demo orders. */
export function exchangeSteps(o: Order): Step[] {
  const x = o.exchange
  if (!x) return []
  const t0 = new Date(x.requestedAt).getTime()
  const unit = x.timeScale === 'demo' ? SEC : DAY / 30
  return [
    { id: 'requested', label: 'รับคำขอเปลี่ยนไซส์', detail: `EU ${x.fromSize} → EU ${x.toSize} · ใช้สิทธิ์ฟรี 1 ครั้งของคำสั่งซื้อนี้`, at: t0 },
    { id: 'shipped', label: 'ส่งคู่ใหม่แล้ว', detail: 'แบรนด์ออกค่าส่งคู่ใหม่ให้', at: t0 + 30 * unit },
    { id: 'done', label: 'คู่ใหม่ส่งถึงแล้ว', detail: `ไซส์ใหม่ EU ${x.toSize}`, at: t0 + 60 * unit },
  ]
}

export const reached =(steps: Step[], now = Date.now()) => steps.filter((s) => s.at <= now).length
