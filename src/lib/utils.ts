export const uid = (prefix = '') =>
  prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)

export const cls = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ')

/** Prototype-only password hash (NOT secure — no real backend exists). */
export function demoHash(s: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return 'fnv1a:' + (h >>> 0).toString(16)
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = () => reject(r.error)
    r.readAsDataURL(file)
  })
}

/** Downscale an image so it fits in localStorage. */
export async function compressImage(file: File, maxW = 900, quality = 0.7): Promise<string> {
  const src = await readFileAsDataUrl(file)
  const img = new Image()
  await new Promise<void>((res, rej) => {
    img.onload = () => res()
    img.onerror = () => rej(new Error('bad image'))
    img.src = src
  })
  const scale = Math.min(1, maxW / img.width)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(img.width * scale)
  canvas.height = Math.round(img.height * scale)
  canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', quality)
}

export const DAY = 86_400_000

export function fmtDate(ts: number, lang: 'th' | 'en', withTime = false) {
  return new Date(ts).toLocaleString(lang === 'th' ? 'th-TH' : 'en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  })
}

export function fmtBytes(n: number) {
  return n > 1024 * 1024 ? (n / 1024 / 1024).toFixed(1) + ' MB' : Math.round(n / 1024) + ' KB'
}

export function startOfMonth(ts = Date.now()) {
  const d = new Date(ts)
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime()
}
