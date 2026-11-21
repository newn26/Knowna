// Minimal browser storage so the store runs under Node.
const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => void m.set(k, String(v)), removeItem: (k) => void m.delete(k), clear: () => m.clear() } }
globalThis.localStorage = mem()
globalThis.sessionStorage = mem()
globalThis.window = { addEventListener() {}, removeEventListener() {}, localStorage, sessionStorage }
