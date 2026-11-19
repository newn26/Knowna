import { useEffect, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { X, Building2, Circle, Coffee, Store, ShoppingCart, Briefcase, Factory, Network, Sparkles, GraduationCap, Cpu, LayoutGrid, Inbox, MessageSquare, FileText, Search, Bell, type LucideIcon } from 'lucide-react'

const ICONS: Record<string, LucideIcon> = { Coffee, Store, ShoppingCart, Briefcase, Factory, Network, Sparkles, GraduationCap, Cpu, LayoutGrid, Inbox, MessageSquare, FileText, Search, Bell }
import { cls } from '../lib/utils'
import { usePrefs } from '../lib/prefs'
import { AppError } from '../lib/store'

type BtnVariant = 'primary' | 'outline' | 'ghost' | 'danger' | 'dark'
export function Button({ variant = 'primary', size = 'md', className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: 'sm' | 'md' | 'lg' }) {
  const v: Record<BtnVariant, string> = {
    primary: 'bg-brand-500 text-white hover:bg-brand-600 border-brand-500',
    outline: 'bg-white text-brand-500 border-brand-500 hover:bg-brand-50',
    ghost: 'bg-transparent border-transparent text-gray-700 hover:bg-gray-100',
    danger: 'bg-white text-red-600 border-red-300 hover:bg-red-50',
    dark: 'bg-ink text-white border-ink hover:bg-gray-800',
  }
  const s = { sm: 'px-3 py-1.5 text-xs', md: 'px-5 py-2.5 text-sm', lg: 'px-7 py-3 text-base' }[size]
  return (
    <button
      {...p}
      className={cls('inline-flex items-center justify-center gap-2 rounded-full border-2 font-semibold transition disabled:cursor-not-allowed disabled:opacity-50', v[variant], s, className)}
    />
  )
}

export function Field({ label, hint, error, children, className }: { label: string; hint?: string; error?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cls('block', className)}>
      <span className="mb-1.5 block text-sm font-semibold text-gray-800">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-muted">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  )
}

const inputCls = 'w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100'
export const Input = (p: InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={cls(inputCls, p.className)} />
export const Textarea = (p: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...p} className={cls(inputCls, 'min-h-[100px]', p.className)} />
export const Select = (p: SelectHTMLAttributes<HTMLSelectElement>) => <select {...p} className={cls(inputCls, 'pr-8', p.className)} />

export const Card = ({ className, children }: { className?: string; children: ReactNode }) => (
  <div className={cls('rounded-xl border border-gray-200 bg-white', className)}>{children}</div>
)

const tone = {
  gray: 'bg-gray-100 text-gray-700',
  blue: 'bg-brand-50 text-brand-600',
  green: 'bg-green-50 text-green-700',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-700',
  dark: 'bg-ink text-white',
}
export const Badge = ({ t = 'gray', children, className }: { t?: keyof typeof tone; children: ReactNode; className?: string }) => (
  <span className={cls('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold', tone[t], className)}>{children}</span>
)

export function StatusBadge({ status }: { status: string }) {
  const { t } = usePrefs()
  const map: Record<string, keyof typeof tone> = {
    draft: 'gray', pending: 'amber', published: 'green', rejected: 'red', under_offer: 'blue', sold: 'dark', hidden: 'gray', archived: 'gray',
    approved: 'green', open: 'amber', accepted: 'green', withdrawn: 'gray', in_progress: 'blue', closed: 'dark', cancelled: 'gray',
    unpaid: 'red', paid: 'green', resolved: 'green', shortlisted: 'green', declined: 'gray',
  }
  return <Badge t={map[status] ?? 'gray'}>{t('status.' + status)}</Badge>
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center" onClick={onClose}>
      <div className={cls('my-8 w-full rounded-xl bg-white shadow-xl', wide ? 'max-w-2xl' : 'max-w-md')} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h3 className="font-semibold">{title}</h3>
          <button onClick={onClose} className="rounded p-1 hover:bg-gray-100" aria-label="close"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export function Empty({ icon = 'Inbox', title, children }: { icon?: string; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
      <Icon name={icon} size={36} className="mb-3 text-muted" />
      <p className="font-semibold text-gray-800">{title}</p>
      {children && <div className="mt-2 text-sm text-gray-500">{children}</div>}
    </div>
  )
}

export function Icon({ name, size = 20, className }: { name: string; size?: number; className?: string }) {
  const C = ICONS[name] ?? Circle
  return <C size={size} className={className} />
}

/** Image with a branded placeholder when the remote image fails to load. */
export function Img({ src, alt, className }: { src?: string; alt: string; className?: string }) {
  const [bad, setBad] = useState(!src)
  useEffect(() => {
    setBad(!src)
  }, [src])
  if (bad)
    return (
      <div className={cls('flex items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100 text-brand-500', className)}>
        <Building2 size={40} />
      </div>
    )
  return <img src={src} alt={alt} loading="lazy" onError={() => setBad(true)} className={cls('object-cover', className)} />
}

/** Show an AppError's translated message; returns a runner that catches. */
export function useErrorText() {
  const { t } = usePrefs()
  return (e: unknown) => (e instanceof AppError ? t('err.' + e.code) : String(e))
}

export function Alert({ t = 'amber', children }: { t?: 'amber' | 'red' | 'blue' | 'green'; children: ReactNode }) {
  const c = { amber: 'border-amber-200 bg-amber-50 text-amber-800', red: 'border-red-200 bg-red-50 text-red-700', blue: 'border-brand-100 bg-brand-50 text-brand-700', green: 'border-green-200 bg-green-50 text-green-800' }[t]
  return <div className={cls('rounded-lg border px-4 py-3 text-sm', c)}>{children}</div>
}

export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { id: T; label: string; count?: number }[] }) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-gray-200">
      {items.map((i) => (
        <button
          key={i.id}
          onClick={() => onChange(i.id)}
          className={cls('-mb-px flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold', value === i.id ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-800')}
        >
          {i.label}
          {!!i.count && <span className="rounded-full bg-brand-500 px-1.5 text-[10px] text-white">{i.count}</span>}
        </button>
      ))}
    </div>
  )
}
