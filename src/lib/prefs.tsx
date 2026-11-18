import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Bi, Currency, Lang } from './types'
import { dict } from './i18n'
import { useDB } from './store'

interface Prefs {
  lang: Lang
  setLang: (l: Lang) => void
  currency: Currency
  setCurrency: (c: Currency) => void
  t: (key: string, vars?: Record<string, string | number>) => string
  L: (b: Bi) => string
  /** Format an amount stored in `from` currency into the viewer's display currency. */
  money: (amount: number, from: Currency, opts?: { compact?: boolean; exact?: boolean }) => string
}

const Ctx = createContext<Prefs>(null!)

function read<T extends string>(k: string, fallback: T): T {
  try {
    return (localStorage.getItem(k) as T) || fallback
  } catch {
    return fallback
  }
}

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [lang, setLangS] = useState<Lang>(() => read<Lang>('bizm:lang', 'th'))
  const [currency, setCurS] = useState<Currency>(() => read<Currency>('bizm:cur', 'THB'))
  const { fx } = useDB()

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((l: Lang) => {
    setLangS(l)
    try { localStorage.setItem('bizm:lang', l) } catch { /* ignore */ }
  }, [])
  const setCurrency = useCallback((c: Currency) => {
    setCurS(c)
    try { localStorage.setItem('bizm:cur', c) } catch { /* ignore */ }
  }, [])

  const value = useMemo<Prefs>(() => {
    const t = (key: string, vars?: Record<string, string | number>) => {
      let s = dict[key]?.[lang] ?? key
      if (vars) Object.entries(vars).forEach(([k, v]) => (s = s.replaceAll(`{${k}}`, String(v))))
      return s
    }
    const money = (amount: number, from: Currency, opts?: { compact?: boolean; exact?: boolean }) => {
      const to = opts?.exact ? from : currency
      let v = amount
      if (from !== to) v = to === 'THB' ? amount * fx.usdThb : amount / fx.usdThb
      const nf = new Intl.NumberFormat(lang === 'th' ? 'th-TH' : 'en-US', {
        style: 'currency',
        currency: to,
        maximumFractionDigits: opts?.compact ? 1 : to === 'USD' && v < 1000 ? 2 : 0,
        notation: opts?.compact ? 'compact' : 'standard',
      })
      return (from !== to ? '≈ ' : '') + nf.format(v)
    }
    return { lang, setLang, currency, setCurrency, t, L: (b) => b[lang], money }
  }, [lang, currency, fx.usdThb, setLang, setCurrency])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const usePrefs = () => useContext(Ctx)
