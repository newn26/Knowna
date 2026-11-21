/** Generated SVG cover art per category, so the demo never depends on a remote image host. */
const STYLE: Record<string, { emoji: string; colors: [string, string][] }> = {
  food: { emoji: '☕', colors: [['#7c2d12', '#f59e0b'], ['#92400e', '#fbbf24'], ['#451a03', '#d97706']] },
  retail: { emoji: '🛍️', colors: [['#831843', '#f472b6'], ['#9d174d', '#fb7185'], ['#500724', '#ec4899']] },
  ecommerce: { emoji: '🛒', colors: [['#0039AB', '#0156FF'], ['#1e3a8a', '#60a5fa'], ['#172554', '#3b82f6']] },
  service: { emoji: '💼', colors: [['#134e4a', '#2dd4bf'], ['#115e59', '#5eead4'], ['#042f2e', '#14b8a6']] },
  manufacturing: { emoji: '🏭', colors: [['#1f2937', '#9ca3af'], ['#111827', '#6b7280'], ['#374151', '#d1d5db']] },
  franchise: { emoji: '🏪', colors: [['#4c1d95', '#a78bfa'], ['#5b21b6', '#c4b5fd'], ['#2e1065', '#8b5cf6']] },
  beauty: { emoji: '💆', colors: [['#701a75', '#e879f9'], ['#86198f', '#f0abfc'], ['#4a044e', '#d946ef']] },
  education: { emoji: '🎓', colors: [['#14532d', '#4ade80'], ['#166534', '#86efac'], ['#052e16', '#22c55e']] },
  tech: { emoji: '💻', colors: [['#000000', '#0156FF'], ['#0f172a', '#38bdf8'], ['#020617', '#6366f1']] },
  other: { emoji: '🏢', colors: [['#334155', '#94a3b8'], ['#1e293b', '#cbd5e1'], ['#0f172a', '#64748b']] },
}

// Free-licence Unsplash photos per category. If the CDN is unreachable, <Img> falls back to its placeholder.
const PHOTOS: Record<string, string[]> = {
  food: ['1521017432531-fbd92d768814', '1453614512568-c4024d13c247', '1538333581680-29dd4752ddf2'],
  retail: ['1441984904996-e0b6ba687e04', '1567401893414-76b7b1e5a7a5', '1441986300917-64674bd600d8'],
  ecommerce: ['1587293852726-70cdb56c2866', '1586528116311-ad8dd3c8310d', '1664382953403-fc1ac77073a0'],
  service: ['1568992687947-868a62a9f521', '1606857521015-7f9fcf423740', '1553877522-43269d4ea984'],
  manufacturing: ['1610891015188-5369212db097', '1717386255773-1e3037c81788', '1578776349090-de61da00ff1a'],
  franchise: ['1571974448718-ac26a9af7d8b', '1605513524006-063ed6ed31e7', '1561710309-9a739908b336'],
  beauty: ['1600334089648-b0d9d3028eb2', '1515377905703-c4788e51af15', '1544161515-4ab6ce6db874'],
  education: ['1580582932707-520aed937b7b', '1509062522246-3755977927d7', '1503676260728-1c00da094a0b'],
  tech: ['1498050108023-c5249f4df085', '1461749280684-dccba630e2f6', '1607799279861-4dd421887fb3'],
  other: ['1486406146926-c627a92ad1ab', '1497366754035-f200968a6e72', '1553877522-43269d4ea984'],
}

export function coverPhoto(category: string, variant: number): string {
  const p = PHOTOS[category] ?? PHOTOS.other
  return `https://images.unsplash.com/photo-${p[variant % p.length]}?w=1200&q=70&auto=format&fit=crop`
}

export function coverSvg(category: string, variant: number, label = ''): string {
  const s = STYLE[category] ?? STYLE.other
  const [a, b] = s.colors[variant % s.colors.length]
  const angle = [0, 45, 90][variant % 3]
  const safe = label.replace(/[<>&"]/g, '').slice(0, 28)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
<defs><linearGradient id="g" gradientTransform="rotate(${angle} .5 .5)"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
<rect width="800" height="600" fill="url(#g)"/>
<circle cx="${620 - variant * 80}" cy="${120 + variant * 60}" r="220" fill="#fff" opacity=".08"/>
<circle cx="${140 + variant * 50}" cy="520" r="160" fill="#fff" opacity=".06"/>
<text x="400" y="${safe ? 330 : 360}" font-size="200" text-anchor="middle">${s.emoji}</text>
${safe ? `<text x="400" y="470" font-family="Poppins,Arial,sans-serif" font-size="40" font-weight="600" fill="#fff" text-anchor="middle" opacity=".9">${safe}</text>` : ''}
</svg>`
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
}
