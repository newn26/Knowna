import black from '../assets/photos/black.webp'
import brown from '../assets/photos/brown.webp'
import white from '../assets/photos/white.webp'
import type { ColorId } from './types'

// AI-generated product shots (Canva) standing in until the brand shoots the real pairs.
export const PHOTOS: Record<ColorId, { src: string; alt: string }> = {
  black: { src: black, alt: 'รองเท้านักเรียนชายหนังสีดำ ผูกเชือก พื้นยางหนา' },
  brown: { src: brown, alt: 'รองเท้านักเรียนชายหนังสีน้ำตาล ผูกเชือก พื้นยางหนา' },
  white: { src: white, alt: 'รองเท้านักเรียนชายหนังสีขาว ผูกเชือก พื้นยางหนา' },
}
