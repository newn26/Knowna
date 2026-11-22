// Order and trade-in progress. Demo orders move forward with the clock so the
// tracking page can be shown live; a real backend would store each step instead.
import type { Order, TradeIn } from './types'

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
      { id: 'packed', label: 'เตรียมสินค้า', detail: 'หยิบคู่ใหม่ตามไซซ์ เช็กความเรียบร้อย', at: t0 + 30 * unit },
      { id: 'ready', label: 'พร้อมรับที่สาขา', detail: 'แสดงเลขคำสั่งซื้อที่เคาน์เตอร์', at: t0 + 60 * unit },
      { id: 'done', label: 'รับสินค้าแล้ว', detail: o.tradeIns.length ? 'ส่งคู่เก่าให้พนักงานตรวจหน้าร้าน' : 'ขอบคุณที่อุดหนุน', at: t0 + 120 * unit },
    ]
  return [
    { id: 'placed', label: 'รับคำสั่งซื้อ', detail: 'ชำระเงินเรียบร้อย', at: t0 },
    { id: 'packed', label: 'แพ็กสินค้า', detail: 'หยิบคู่ใหม่ตามไซซ์ เช็กความเรียบร้อย', at: t0 + 30 * unit },
    { id: 'shipped', label: 'กำลังจัดส่ง', detail: 'ไรเดอร์กำลังไปหาคุณ', at: t0 + 60 * unit },
    {
      id: 'done',
      label: 'ส่งถึงแล้ว',
      detail: o.tradeIns.length ? 'ไรเดอร์รับคู่เก่ากลับตอนส่งคู่ใหม่' : 'ขอบคุณที่อุดหนุน',
      at: t0 + 120 * unit,
    },
  ]
}

/** What happens to a traded-in pair after the customer hands it over. */
export function tradeInSteps(o: Order, _t: TradeIn): Step[] {
  const handover = orderSteps(o).at(-1)!.at
  const unit = o.timeScale === 'demo' ? SEC : DAY / 10
  return [
    { id: 'received', label: 'รับคู่เก่าแล้ว', detail: 'ปิดถุงพร้อมแท็ก Product ID', at: handover },
    { id: 'inspection', label: 'Inspection', detail: 'ช่างตรวจสภาพซ้ำตามเช็กลิสต์ 5 จุด', at: handover + 20 * unit },
    { id: 'cleaning', label: 'Cleaning & Sanitizing', detail: 'ล้าง ขัด อบโอโซนฆ่าเชื้อ เปลี่ยนแผ่นรอง', at: handover + 40 * unit },
    { id: 'qc', label: 'Quality Check', detail: 'ตรวจรอบสุดท้าย ให้เกรดและถ่ายรูปจริง', at: handover + 60 * unit },
    { id: 'listed', label: 'ขึ้นร้าน Pre-owned', detail: 'พร้อมเดินต่อกับนักเรียนคนถัดไป', at: handover + 80 * unit },
  ]
}

export const reached = (steps: Step[], now = Date.now()) => steps.filter((s) => s.at <= now).length
