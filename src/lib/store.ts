// Client-side state (cart, session, theme). Persisted per browser in localStorage.
// This stays on the client even with a real backend; only api.ts changes.
import { useSyncExternalStore } from 'react'
import type { CartLine, User } from './types'

/** A child's saved foot length, so the parent can be reminded before term (report 1.4). */
export interface Kid {
  id: string
  name: string
  grade: string // GRADES id
  cm: number
  measuredAt: string
}

interface State {
  cart: CartLine[]
  user: User | null
  orders: string[] // ids placed from this browser, so guests also get an order history
  kids: Kid[]
  remind: boolean // simulated: no SMS is really sent
  cartOpen: boolean
  toast: { id: number; text: string } | null
}

const KEY = 'kw.client.v3'

function read(): State {
  const base: State = { cart: [], user: null, orders: [], kids: [], remind: true, cartOpen: false, toast: null }
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
    const { cart, user, orders, kids, remind } = state
    localStorage.setItem(KEY, JSON.stringify({ cart, user, orders, kids, remind }))
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
    const key = `${line.kind}-${line.color}-${line.size}`
    const existing = state.cart.find((l) => l.key === key)
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

  clearCart: () => set({ cart: [] }),
  rememberOrder: (id: string) => set({ orders: [id, ...state.orders.filter((x) => x !== id)] }),
  login: (user: User) =>
    set({
      user,
      // the demo parent has two sons; one was measured long ago so the "measure again" hint shows
      kids: state.kids.length
        ? state.kids
        : [
            { id: 'k1', name: 'น้องภูมิ', grade: 'm1', cm: 24, measuredAt: '2026-10-01' },
            { id: 'k2', name: 'น้องต้น', grade: 'p3', cm: 19.5, measuredAt: '2025-11-10' },
          ],
    }),
  saveKid: (kid: Kid) => set({ kids: state.kids.some((k) => k.id === kid.id) ? state.kids.map((k) => (k.id === kid.id ? kid : k)) : [...state.kids, kid] }),
  removeKid: (id: string) => set({ kids: state.kids.filter((k) => k.id !== id) }),
  setRemind: (remind: boolean) => set({ remind }),
  logout: () => set({ user: null }),
}
