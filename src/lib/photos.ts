import black from '../assets/photos/black.webp'
import brown from '../assets/photos/brown.webp'
import white from '../assets/photos/white.webp'
import type { ColorId } from './types'

// Stand-in real photos (CC0, Wikimedia Commons) until the brand shoots its own product photos.
export const PHOTOS: Record<ColorId, { src: string; alt: string; fit: string; source: string }> = {
  black: { src: black, alt: 'รองเท้าหนังสีดำ ผูกเชือก มุมด้านข้าง', fit: 'object-contain bg-white', source: 'https://commons.wikimedia.org/wiki/File:Shoe-PlainDerby-Black.jpg' },
  brown: { src: brown, alt: 'รองเท้าหนังสีน้ำตาล ผูกเชือก มุมด้านข้าง', fit: 'object-contain bg-white', source: 'https://commons.wikimedia.org/wiki/File:A_plein_Derby_with_Captoe.jpg' },
  white: { src: white, alt: 'รองเท้าผ้าใบสีขาว ใส่จริง', fit: 'object-cover', source: 'https://commons.wikimedia.org/wiki/File:Geremi_Gascon_2015_(Unsplash).jpg' },
}
