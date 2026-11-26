import blackPair from '../assets/photos/black.webp'
import blackSide from '../assets/photos/black-side.webp'
import brownPair from '../assets/photos/brown.webp'
import brownSide from '../assets/photos/brown-side.webp'
import brownUsed from '../assets/photos/brown-used.webp'
import brownWorn from '../assets/photos/brown-worn.webp'
import whitePair from '../assets/photos/white.webp'
import whiteSide from '../assets/photos/white-side.webp'
import footSide from '../assets/photos/foot-side.webp'
import type { ColorId } from './types'

type Photo = { src: string; alt: string }

// AI-generated product shots standing in until the brand photographs real pairs.
// `side` images are cut-outs with a transparent background; `pair` images keep their studio backdrop.
export const PHOTOS: Record<ColorId, { pair: Photo; side: Photo }> = {
  black: {
    pair: { src: blackPair, alt: 'รองเท้าผ้าใบนักเรียน KNOWNA สีดำ หนึ่งคู่ วางข้างกล่อง' },
    side: { src: blackSide, alt: 'รองเท้าผ้าใบนักเรียน KNOWNA สีดำ มุมด้านข้าง' },
  },
  white: {
    pair: { src: whitePair, alt: 'รองเท้าผ้าใบนักเรียน KNOWNA สีขาว หนึ่งคู่ วางข้างกล่อง' },
    side: { src: whiteSide, alt: 'รองเท้าผ้าใบนักเรียน KNOWNA สีขาว มุมด้านข้าง' },
  },
  brown: {
    pair: { src: brownPair, alt: 'รองเท้าผ้าใบนักเรียน KNOWNA สีน้ำตาล หนึ่งคู่ วางข้างกล่อง' },
    side: { src: brownSide, alt: 'รองเท้าผ้าใบนักเรียน KNOWNA สีน้ำตาล มุมด้านข้าง' },
  },
}

/** Brown pair after a year of school: canvas fine, tread worn down. */
export const USED: Photo = { src: brownUsed, alt: 'รองเท้าผ้าใบสีน้ำตาลที่ใส่มาแล้วราวหนึ่งปี มีรอยใช้งาน' }
/** Bare foot, side view, toes left. Public domain photo "Foot-outside.jpg" (Wikimedia Commons, en:User:Aarchiba), background removed and mirrored. */
export const FOOT: Photo = { src: footSide, alt: 'เท้ามองจากด้านข้าง ปลายนิ้วอยู่ซ้าย ส้นเท้าอยู่ขวา' }
/** Brown pair worn out: torn canvas, caked sole. */
export const WORN: Photo = { src: brownWorn, alt: 'รองเท้าผ้าใบสีน้ำตาลสภาพชำรุด ผ้าขาด พื้นเลอะ' }
