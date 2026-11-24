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
  if (o.fulfilment === 'pickup')
    return [
      { id: 'placed', label: 'รับคำสั่งซื้อ', detail: 'ชำระเงินเรียบร้อย', at: t0 },
      { id: 'packed', label: 'เตรียมสินค้า', detail: 'หยิบสินค้าตามไซซ์ เช็กความเรียบร้อย', at: t0 + 30 * unit },
      { id: 'ready', label: 'พร้อมรับที่สาขา', detail: 'แสดงเลขคำสั่งซื้อที่เคาน์เตอร์', at: t0 + 60 * unit },
      { id: 'done', label: 'รับสินค้าแล้ว', detail: 'ขอบคุณที่อุดหนุน', at: t0 + 120 * unit },
    ]
  return [
    { id: 'placed', label: 'รับคำสั่งซื้อ', detail: 'ชำระเงินเรียบร้อย', at: t0 },
    { id: 'packed', label: 'แพ็กสินค้า', detail: 'หยิบสินค้าตามไซซ์ เช็กความเรียบร้อย', at: t0 + 30 * unit },
    { id: 'shipped', label: 'กำลังจัดส่ง', detail: 'ไรเดอร์กำลังไปหาคุณ', at: t0 + 60 * unit },
    {
      id: 'done',
      label: 'ส่งถึงแล้ว',
      detail: 'ขอบคุณที่อุดหนุน',
      at: t0 + 120 * unit,
    },
  ]
}

export const reached = (steps: Step[], now = Date.now()) => steps.filter((s) => s.at <= now).length
