import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { MailCheck, ShoppingBag, Store } from 'lucide-react'
import { usePrefs } from '../lib/prefs'
import { AppError, auth } from '../lib/store'
import { DEMO_ACCOUNTS } from '../lib/seed'
import type { Role, User } from '../lib/types'
import { cls } from '../lib/utils'
import { Alert, Button, Field, Input, useErrorText } from '../components/ui'

function Shell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-12 md:grid-cols-2">
      <div className="hidden flex-col justify-center rounded-2xl bg-gradient-to-br from-ink to-brand-700 p-10 text-white md:flex">
        <span className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500 text-xl font-bold">B</span>
        <h2 className="text-3xl font-bold leading-tight">BizMarket</h2>
        <p className="mt-3 text-gray-300">{subtitle}</p>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white p-8">
        <h1 className="mb-6 text-2xl font-bold">{title}</h1>
        {children}
      </div>
    </div>
  )
}

function GoogleButton({ onDone }: { onDone: () => void }) {
  const { t } = usePrefs()
  const err = useErrorText()
  const [e, setE] = useState('')
  return (
    <>
      <button
        onClick={() => { try { auth.loginGoogle(); onDone() } catch (x) { setE(err(x)) } }}
        className="flex w-full items-center justify-center gap-3 rounded-full border-2 border-gray-200 py-2.5 text-sm font-semibold hover:bg-gray-50"
      >
        <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
        {t('auth.google')}
      </button>
      {e && <p className="mt-2 text-xs text-red-600">{e}</p>}
      <div className="my-5 flex items-center gap-3 text-xs text-muted"><span className="h-px flex-1 bg-gray-200" />{t('auth.or')}<span className="h-px flex-1 bg-gray-200" /></div>
    </>
  )
}

export function Login() {
  const { t } = usePrefs()
  const nav = useNavigate()
  const [sp] = useSearchParams()
  const next = sp.get('next') || '/dashboard'
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [error, setError] = useState('')
  const err = useErrorText()
  const submit = (e?: React.FormEvent, em = email, p = pw) => {
    e?.preventDefault()
    try {
      const u = auth.login(em, p)
      nav(u.isAdmin && next === '/dashboard' ? '/admin' : next, { replace: true })
    } catch (x) {
      setError(err(x))
    }
  }
  return (
    <Shell title={t('auth.loginTitle')} subtitle={t('auth.pitch')}>
      <GoogleButton onDone={() => nav(next, { replace: true })} />
      <form onSubmit={submit} className="space-y-4">
        <Field label={t('auth.email')}><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label={t('auth.password')}><Input type="password" required value={pw} onChange={(e) => setPw(e.target.value)} /></Field>
        {error && <Alert t="red">{error}</Alert>}
        <Button className="w-full">{t('nav.login')}</Button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-500">{t('auth.noAccount')} <Link to="/register" className="font-semibold text-brand-500">{t('nav.register')}</Link></p>
      <div className="mt-6 rounded-lg bg-surface p-4">
        <p className="mb-2 text-xs font-semibold uppercase text-muted">{t('auth.demoAccounts')}</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {DEMO_ACCOUNTS.map((a) => (
            <button key={a.email} onClick={() => submit(undefined, a.email, a.password)} className="rounded-md border bg-white px-2 py-2 text-xs font-semibold hover:border-brand-500">
              {t('auth.demo.' + a.role)}
            </button>
          ))}
        </div>
      </div>
    </Shell>
  )
}

export function Register() {
  const { t } = usePrefs()
  const nav = useNavigate()
  const err = useErrorText()
  const [role, setRole] = useState<Role>('buyer')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [accept, setAccept] = useState(false)
  const [error, setError] = useState('')
  const [pending, setPending] = useState<User | null>(null)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (pw.length < 8) return setError(t('auth.pwShort'))
    if (pw !== pw2) return setError(t('auth.pwMismatch'))
    try {
      setPending(auth.register({ email, name, password: pw, primaryRole: role }))
    } catch (x) {
      setError(x instanceof AppError ? err(x) : String(x))
    }
  }

  if (pending)
    return (
      <Shell title={t('auth.verifyTitle')} subtitle={t('auth.pitch')}>
        <div className="text-center">
          <MailCheck size={48} className="mx-auto text-brand-500" />
          <p className="mt-4 text-sm text-gray-600">{t('auth.verifyBody', { email: pending.email })}</p>
          <Alert t="blue"><span className="text-xs">{t('auth.verifyDemo')}</span></Alert>
          <Button className="mt-4 w-full" onClick={() => { auth.verifyEmail(pending.id); nav(role === 'seller' ? '/sell' : '/search', { replace: true }) }}>{t('auth.verifyButton')}</Button>
        </div>
      </Shell>
    )

  return (
    <Shell title={t('auth.registerTitle')} subtitle={t('auth.pitch')}>
      <GoogleButton onDone={() => nav('/dashboard', { replace: true })} />
      <form onSubmit={submit} className="space-y-4">
        <div>
          <p className="mb-1.5 text-sm font-semibold">{t('auth.iWantTo')}</p>
          <div className="grid grid-cols-2 gap-2">
            {([['buyer', <ShoppingBag key="b" size={20} />], ['seller', <Store key="s" size={20} />]] as const).map(([r, icon]) => (
              <button type="button" key={r} onClick={() => setRole(r)} className={cls('flex flex-col items-center gap-1 rounded-lg border-2 p-3 text-sm font-semibold', role === r ? 'border-brand-500 bg-brand-50 text-brand-600' : 'border-gray-200 text-gray-600')}>
                {icon} {t('auth.want.' + r)}
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs text-muted">{t('auth.roleHint')}</p>
        </div>
        <Field label={t('auth.name')}><Input required value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label={t('auth.email')}><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('auth.password')}><Input type="password" required value={pw} onChange={(e) => setPw(e.target.value)} /></Field>
          <Field label={t('auth.password2')}><Input type="password" required value={pw2} onChange={(e) => setPw2(e.target.value)} /></Field>
        </div>
        <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} className="mt-1" /> <span>{t('auth.terms')}</span></label>
        {error && <Alert t="red">{error}</Alert>}
        <Button className="w-full" disabled={!accept}>{t('nav.register')}</Button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-500">{t('auth.haveAccount')} <Link to="/login" className="font-semibold text-brand-500">{t('nav.login')}</Link></p>
    </Shell>
  )
}
