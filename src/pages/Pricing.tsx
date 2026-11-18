import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import { usePrefs } from '../lib/prefs'
import { billing, planOf, useDB, useMe, useSession } from '../lib/store'
import type { Plan, Role } from '../lib/types'
import { cls } from '../lib/utils'
import { Page } from '../components/Layout'
import { Alert, Button, useErrorText } from '../components/ui'

export function planPerks(p: Plan, t: (k: string, v?: Record<string, string | number>) => string): string[] {
  if (p.audience === 'seller')
    return [
      p.listingLimit == null ? t('plan.unlimitedListings') : t('plan.listings', { n: p.listingLimit }),
      t('plan.fee', { n: p.feePercent }),
      ...(p.featured ? [t('plan.featured')] : []),
      t('plan.chatNda'),
    ]
  return [
    t('plan.browse'),
    p.ndaLimitPerMonth == null ? t('plan.unlimitedNda') : t('plan.nda', { n: p.ndaLimitPerMonth }),
    ...(p.alerts ? [t('plan.alerts')] : []),
    t('plan.chatNda'),
  ]
}

export default function Pricing() {
  const d = useDB()
  const me = useMe()
  const session = useSession()
  const { t, L, currency, money } = usePrefs()
  const nav = useNavigate()
  const err = useErrorText()
  const [aud, setAud] = useState<Role>(session?.role ?? 'seller')
  const [error, setError] = useState('')
  const plans = d.plans.filter((p) => p.audience === aud && p.active)
  const current = me ? planOf(d, me, aud) : null

  const choose = (p: Plan) => {
    if (!me) return nav('/login?next=/pricing')
    try {
      const inv = billing.subscribe(p.id, currency)
      if (inv) nav(`/checkout/${inv}`)
    } catch (e) {
      setError(err(e))
    }
  }

  return (
    <Page>
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-bold">{t('pricing.title')}</h1>
        <p className="mt-2 text-gray-500">{t('pricing.subtitle')}</p>
        <div className="mt-6 inline-flex rounded-full border bg-white p-1">
          {(['seller', 'buyer'] as Role[]).map((r) => (
            <button key={r} onClick={() => setAud(r)} className={cls('rounded-full px-6 py-2 text-sm font-semibold', aud === r ? 'bg-brand-500 text-white' : 'text-gray-600')}>{t('pricing.for.' + r)}</button>
          ))}
        </div>
      </div>
      {error && <div className="mx-auto mt-4 max-w-md"><Alert t="red">{error}</Alert></div>}
      <div className={cls('mx-auto mt-10 grid gap-6', plans.length === 3 ? 'max-w-5xl md:grid-cols-3' : 'max-w-3xl md:grid-cols-2')}>
        {plans.map((p, i) => {
          const isCurrent = current?.id === p.id
          const highlight = i === 1
          const price = currency === 'THB' ? p.priceTHB : p.priceUSD
          return (
            <div key={p.id} className={cls('flex flex-col rounded-2xl border bg-white p-7', highlight ? 'border-brand-500 shadow-xl ring-2 ring-brand-500' : 'border-gray-200')}>
              {highlight && <span className="mb-3 w-fit rounded-full bg-brand-500 px-3 py-0.5 text-xs font-semibold text-white">{t('pricing.popular')}</span>}
              <h3 className="text-xl font-bold">{L(p.name)}</h3>
              <p className="mt-3"><span className="text-4xl font-bold">{price === 0 ? t('pricing.free') : money(price, currency, { exact: true })}</span>{price > 0 && <span className="text-sm text-muted"> / {t('pricing.month')}</span>}</p>
              <ul className="mt-6 flex-1 space-y-3 text-sm">
                {planPerks(p, t).map((x) => <li key={x} className="flex gap-2"><Check size={18} className="shrink-0 text-brand-500" /> {x}</li>)}
              </ul>
              <Button className="mt-8 w-full" variant={highlight ? 'primary' : 'outline'} disabled={isCurrent} onClick={() => choose(p)}>
                {isCurrent ? t('pricing.current') : price === 0 ? t('pricing.downgrade') : t('pricing.choose')}
              </Button>
            </div>
          )
        })}
      </div>
      <p className="mx-auto mt-8 max-w-2xl text-center text-xs text-muted">{t('pricing.note')}</p>
    </Page>
  )
}
