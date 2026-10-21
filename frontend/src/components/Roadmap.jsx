import { useState } from 'react'
import { hostOf } from '../util'

const usd = (n) => '$' + Math.round(n).toLocaleString('en-US')
const range = (a, b, fmt = (x) => x) => (Math.round(a) === Math.round(b) ? fmt(a) : `${fmt(a)} to ${fmt(b)}`)
const months = (w) => Math.max(1, Math.round(w / 4.33))

export default function Roadmap({ roadmap, profile }) {
  const { steps } = roadmap
  const index = Object.fromEntries(steps.map((s, i) => [s.id, i + 1]))
  const storeKey = 'bridgepath-done:' + roadmap.headline + steps.map((s) => s.id).join()
  const [done, setDone] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storeKey)) || [] } catch { return [] }
  })
  const toggle = (id) => {
    const next = done.includes(id) ? done.filter((d) => d !== id) : [...done, id]
    setDone(next)
    try { localStorage.setItem(storeKey, JSON.stringify(next)) } catch { /* storage unavailable */ }
  }
  const count = steps.filter((s) => done.includes(s.id)).length
  const pct = steps.length ? Math.round((count / steps.length) * 100) : 0

  return (
    <div className="space-y-6">
      <section className="fade-up print-break rounded-3xl bg-gradient-to-br from-brand to-brand-dark p-6 text-white shadow-sm sm:p-8">
        <p className="text-sm font-medium text-white/80">
          Your path as a {profile?.degree} holder from {profile?.country} → {profile?.target_state}
        </p>
        <h2 className="mt-2 font-display text-2xl leading-snug sm:text-3xl">{roadmap.headline}</h2>
        <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat label="Estimated cost" value={range(roadmap.total_cost_usd_min, roadmap.total_cost_usd_max, usd)} />
          <Stat label="Estimated time" value={`${range(months(roadmap.total_weeks_min), months(roadmap.total_weeks_max))} months`} />
          <Stat label="US equivalent" value={roadmap.us_equivalent} className="col-span-2 sm:col-span-1" />
        </dl>
      </section>

      <section>
        <div className="no-print sticky top-[65px] z-10 -mx-1 mb-4 rounded-xl bg-paper/90 px-1 py-2 backdrop-blur">
          <div className="flex items-baseline justify-between">
            <h3 className="font-display text-xl">Your steps</h3>
            <span className="text-sm text-muted">{count} of {steps.length} done</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-brand-soft">
            <div className="h-full rounded-full bg-brand transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          {count === steps.length && steps.length > 0 && (
            <p className="fade-up mt-2 text-sm font-medium text-brand">🎉 Every step done. Congratulations, you made it!</p>
          )}
        </div>
        <h3 className="mb-4 hidden font-display text-xl print:block">Your steps</h3>
        <ol className="relative space-y-4 border-l-2 border-brand-soft pl-6 sm:ml-3">
          {steps.map((s, i) => {
            const isDone = done.includes(s.id)
            return (
            <li key={s.id} className="fade-up print-break relative" style={{ animationDelay: `${i * 90}ms` }}>
              <button type="button" onClick={() => toggle(s.id)} aria-pressed={isDone}
                title={isDone ? 'Mark as not done' : 'Mark as done'}
                className={`absolute -left-[37px] flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ring-4 ring-paper transition hover:scale-110 ${isDone ? 'bg-accent text-white' : 'bg-brand text-white'}`}>
                {isDone ? '✓' : i + 1}
              </button>
              <div className={`rounded-xl border bg-card p-5 shadow-sm transition hover:shadow-md ${isDone ? 'border-accent/40 opacity-75' : 'border-line hover:border-brand/50'}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h4 className={`font-semibold text-ink ${isDone ? 'line-through decoration-accent/60' : ''}`}>{s.title}</h4>
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    <Chip>{s.cost_usd_max > 0 ? range(s.cost_usd_min, s.cost_usd_max, usd) : 'Free'}</Chip>
                    <Chip>{range(s.duration_weeks_min, s.duration_weeks_max)} weeks</Chip>
                  </div>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.description}</p>
                {s.depends_on.filter((d) => index[d]).length > 0 && (
                  <p className="mt-2 text-xs text-muted">
                    After step {s.depends_on.filter((d) => index[d]).map((d) => index[d]).join(', ')}
                  </p>
                )}
                {s.documents.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted">You'll need</p>
                    <ul className="mt-1 flex flex-wrap gap-1.5">
                      {s.documents.map((d) => (
                        <li key={d} className="rounded-md bg-paper px-2 py-1 text-xs text-ink">{d}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="mt-3 text-xs">
                  {s.official ? (
                    <a href={s.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-brand hover:underline">
                      ✓ Official source: {hostOf(s.source_url)}
                    </a>
                  ) : s.verified ? (
                    <span className="text-accent">
                      Unofficial source:{' '}
                      <a href={s.source_url} target="_blank" rel="noreferrer" className="underline">{hostOf(s.source_url)}</a>
                      . Double-check with the state board.
                    </span>
                  ) : (
                    <span className="text-accent">No source found for this step. Confirm with the state board.</span>
                  )}
                </div>
                <label className="no-print mt-4 flex w-fit cursor-pointer items-center gap-2 text-sm text-muted hover:text-ink">
                  <input type="checkbox" checked={isDone} onChange={() => toggle(s.id)} className="h-4 w-4 accent-[#0f766e]" />
                  I've done this
                </label>
              </div>
            </li>
            )
          })}
        </ol>
      </section>

      {roadmap.bridge_jobs.length > 0 && (
        <section className="print-break">
          <h3 className="mb-1 font-display text-xl">Work you can do now</h3>
          <p className="mb-4 text-sm text-muted">Jobs that use your skills and build US experience while you get licensed.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {roadmap.bridge_jobs.map((j) => (
              <div key={j.title} className="rounded-xl border border-line bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-brand/50 hover:shadow-md">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold">{j.title}</h4>
                  {j.typical_pay && <span className="shrink-0 text-xs font-medium text-brand">{j.typical_pay}</span>}
                </div>
                <p className="mt-1 text-sm text-muted">{j.why}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {roadmap.warnings.length > 0 && (
        <section className="print-break rounded-xl border border-accent/30 bg-accent-soft p-5">
          <h3 className="mb-2 font-semibold text-ink">Watch out for</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm text-ink">
            {roadmap.warnings.map((w) => <li key={w}>{w}</li>)}
          </ul>
        </section>
      )}

      {roadmap.sources.length > 0 && (
        <section className="print-break">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">Sources</h3>
          <ul className="space-y-1 text-sm">
            {roadmap.sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noreferrer" className="text-brand hover:underline">{s.title || s.url}</a>
                <span className="text-muted"> · {hostOf(s.url)}{s.official ? ' · official' : ''}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-xs text-muted">
        Bridgepath gives guidance, not legal advice. Rules change; always confirm with the official licensing board.
      </p>
    </div>
  )
}

function Stat({ label, value, className = '' }) {
  return (
    <div className={`rounded-xl bg-white/10 p-3 ${className}`}>
      <dt className="text-xs text-white/75">{label}</dt>
      <dd className="mt-0.5 font-semibold">{value}</dd>
    </div>
  )
}

function Chip({ children }) {
  return <span className="rounded-full bg-brand-soft px-2.5 py-1 font-medium text-brand-dark">{children}</span>
}
