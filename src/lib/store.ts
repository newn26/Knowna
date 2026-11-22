// Client-side state (cart, session, theme). Persisted per browser in localStorage.
// This stays on the client even with a real backend; only api.ts changes.
import { useSyncExternalStore } from 'react'
import type { CartLine, TradeIn, User } from './types'

interface State {
  cart: CartLine[]
  tradeIns: TradeIn[]
  user: User | null
  orders: string[] // ids placed from this browser, so guests also get an order history
  cartOpen: boolean
  toast: { id: number; text: string } | null
}

const KEY = 'kw.client.v2'

function read(): State {
  const base: State = { cart: [], tradeIns: [], user: null, orders: [], cartOpen: false, toast: null }
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...base, ...JSON.parse(raw), cartOpen: false, toast: null }
  } catch {
    /* ignore */
  }
  return base
}

let state = read()
const listeners = new Set<() => void>()

function set(patch: Partial<State>) {
  state = { ...state, ...patch }
  try {
    const { cart, tradeIns, user, orders } = state
    localStorage.setItem(KEY, JSON.stringify({ cart, tradeIns, user, orders }))
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l())
}

export function useStore<T>(pick: (s: State) => T): T {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => pick(state),
  )
}

export const getState = () => state

let toastTimer: ReturnType<typeof setTimeout> | undefined

export const actions = {
  toast(text: string) {
    clearTimeout(toastTimer)
    set({ toast: { id: Date.now(), text } })
    toastTimer = setTimeout(() => set({ toast: null }), 2600)
  },
  openCart: (open = true) => set({ cartOpen: open }),

  addLine(line: Omit<CartLine, 'key'>) {
    const key = line.kind === 'preowned' ? `po-${line.preownedId}` : `new-${line.color}-${line.size}`
    const existing = state.cart.find((l) => l.key === key)
    if (existing && line.kind === 'preowned') return // one of a kind
    const cart = existing
      ? state.cart.map((l) => (l.key === key ? { ...l, qty: l.qty + line.qty } : l))
      : [...state.cart, { ...line, key }]
    set({ cart })
  },
  setQty(key: string, qty: number) {
    set({ cart: qty <= 0 ? state.cart.filter((l) => l.key !== key) : state.cart.map((l) => (l.key === key ? { ...l, qty } : l)) })
  },
  removeLine(key: string) {
    set({ cart: state.cart.filter((l) => l.key !== key) })
    actions.toast('ลบออกจากตะกร้าแล้ว')
  },

  addTradeIn: (t: TradeIn) => set({ tradeIns: [...state.tradeIns.filter((x) => x.serial !== t.serial), t] }),
  removeTradeIn: (id: string) => set({ tradeIns: state.tradeIns.filter((t) => t.id !== id) }),

  clearCart: () => set({ cart: [], tradeIns: [] }),
  rememberOrder: (id: string) => set({ orders: [id, ...state.orders.filter((x) => x !== id)] }),
  login: (user: User) => set({ user }),
  logout: () => set({ user: null }),
}
