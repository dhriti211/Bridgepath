import { useState } from 'react'
import { downloadIcs } from '../calendar'
import { hostOf } from '../util'

const usd = (n) => '$' + Math.round(n).toLocaleString('en-US')
const range = (a, b, fmt = (x) => x) => (Math.round(a) === Math.round(b) ? fmt(a) : `${fmt(a)} to ${fmt(b)}`)
const months = (w) => Math.max(1, Math.round(w / 4.33))

export default function Roadmap({ roadmap, profile }) {
  const { steps } = roadmap
  const student = roadmap.mode === 'student'
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
  const visa = steps.filter((s) => s.kind !== 'career')
  const officialCount = visa.filter((s) => s.official).length

  const tabs = [
    ['plan', 'Plan'],
    (roadmap.deadlines?.length || roadmap.h1b_seasons?.length) && ['dates', 'Dates'],
    roadmap.bridge_jobs.length && ['employers', student ? 'Employers' : 'Jobs now'],
    (roadmap.policy?.length || roadmap.news?.length || roadmap.sources.length) && ['rules', student ? 'Rule changes' : 'Sources'],
  ].filter(Boolean)
  const [tab, setTab] = useState('plan')
  // Hidden tabs still print, so the PDF has everything.
  const panel = (key) => (tab === key ? 'space-y-6' : 'hidden space-y-6 print:block')

  return (
    <div className="space-y-6">
      <section className="fade-up print-break relative overflow-hidden rounded-3xl bg-night p-6 text-white sm:p-8">
        <div className="grid-bg absolute inset-0" aria-hidden="true" />
        <div className="relative">
          <p className="font-mono text-xs text-slate-400">
            {student
              ? `${profile?.degree_level} ${profile?.major} → ${profile?.target_role}`
              : `${profile?.degree} · ${profile?.country} → ${profile?.target_state}`}
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold leading-snug sm:text-3xl">{roadmap.headline}</h2>
          <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat label="Cost to you" value={range(roadmap.total_cost_usd_min, roadmap.total_cost_usd_max, usd)} />
            <Stat label="Time" value={`${range(months(roadmap.total_weeks_min), months(roadmap.total_weeks_max))} months`} />
            {roadmap.us_equivalent && (
              <Stat label={student ? 'Visa path' : 'US equivalent'} value={roadmap.us_equivalent} className="col-span-2 sm:col-span-1" />
            )}
          </dl>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            {visa.length > 0 && (
              <span className="inline-flex items-center gap-1.5 text-teal-200">
                ✓ {officialCount} of {visa.length} {student ? 'visa' : 'licensing'} steps officially sourced
              </span>
            )}
            <span className="text-slate-400">{count} of {steps.length} steps done</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-teal-300 transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </section>

      <div role="tablist" className="no-print sticky top-[65px] z-10 -mx-1 flex gap-1 overflow-x-auto rounded-xl border border-line bg-card/90 p-1 backdrop-blur">
        {tabs.map(([key, label]) => (
          <button key={key} role="tab" aria-selected={tab === key} onClick={() => setTab(key)}
            className={`shrink-0 flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${tab === key ? 'bg-ink text-white' : 'text-muted hover:text-ink'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className={panel('plan')}>
        {count === steps.length && steps.length > 0 && (
          <p className="fade-up rounded-xl bg-brand-soft px-4 py-3 text-sm font-medium text-brand-dark">Every step done. Congratulations!</p>
        )}
        <ol className="space-y-3">
          {steps.map((s, i) => (
            <StepCard key={s.id} step={s} n={i + 1} index={index} done={done.includes(s.id)}
              onToggle={() => toggle(s.id)} student={student} />
          ))}
        </ol>
        {roadmap.warnings.length > 0 && <Warnings warnings={roadmap.warnings} />}
      </div>

      {tabs.some(([k]) => k === 'dates') && (
        <div className={panel('dates')}>
          {roadmap.deadlines?.length > 0 && <Deadlines deadlines={roadmap.deadlines} />}
          {roadmap.h1b_seasons?.length > 0 && <H1BChances seasons={roadmap.h1b_seasons} />}
        </div>
      )}

      {roadmap.bridge_jobs.length > 0 && (
        <div className={panel('employers')}>
          <p className="text-sm text-muted">
            {student ? 'Where sponsorship is more likely for this goal. Pay ranges are rough estimates.' : 'Jobs that use your skills while you get licensed.'}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {roadmap.bridge_jobs.map((j) => (
              <div key={j.title} className="rounded-2xl border border-line bg-card p-5">
                <h4 className="font-medium">{j.title}</h4>
                {j.typical_pay && <p className="mt-1 font-mono text-xs text-brand">{j.typical_pay}</p>}
                <p className="mt-2 text-sm text-muted">{j.why}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={panel('rules')}>
        {roadmap.policy?.length > 0 && <PolicyWatch policy={roadmap.policy} />}
        {roadmap.news?.length > 0 && (
          <Fold title="In the news this month" note="Found live by Tavily. News is not the rule; check the official link.">
            <LinkList items={roadmap.news.slice(0, 5)} dated />
          </Fold>
        )}
        {roadmap.sources.length > 0 && (
          <Fold title={`Sources (${roadmap.sources.length})`}>
            <LinkList items={roadmap.sources} />
          </Fold>
        )}
      </div>

      <p className="text-xs text-muted">
        {student
          ? 'Guidance, not legal advice. Confirm every step with your DSO, and talk to an immigration attorney for anything beyond OPT.'
          : 'Guidance, not legal advice. Always confirm with the official licensing board.'}
      </p>
    </div>
  )
}

function StepCard({ step: s, n, index, done, onToggle, student }) {
  const [open, setOpen] = useState(false)
  const after = s.depends_on.filter((d) => index[d]).map((d) => index[d])
  return (
    <li className={`print-break rounded-2xl border bg-card transition ${done ? 'border-brand/30' : 'border-line hover:border-slate-300'}`}>
      <div className="flex items-start gap-3 p-4">
        <button type="button" onClick={onToggle} aria-pressed={done} title={done ? 'Mark as not done' : "I've done this"}
          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-xs font-medium transition hover:scale-110 ${done ? 'bg-brand text-white' : 'border border-line text-muted hover:border-brand hover:text-brand'}`}>
          {done ? '✓' : n}
        </button>
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="min-w-0 flex-1 text-left">
          <div className="flex items-start justify-between gap-2">
            <h4 className={`min-w-0 font-medium ${done ? 'text-muted line-through decoration-brand/50' : ''}`}>{s.title}</h4>
            <span className="no-print shrink-0 text-muted transition" style={{ transform: open ? 'rotate(180deg)' : 'none' }}>⌄</span>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 font-mono text-xs text-muted">
            <span>{s.cost_usd_max > 0 ? range(s.cost_usd_min, s.cost_usd_max, usd) : 'Free'}</span>
            <span>{range(s.duration_weeks_min, s.duration_weeks_max)} wk</span>
            {s.official ? <span className="text-brand">✓ {hostOf(s.source_url)}</span>
              : s.kind === 'career' ? <span>career step</span>
                : !s.verified && <span className="text-accent">no source</span>}
          </div>
        </button>
      </div>
      <div className={`${open ? '' : 'hidden print:block'} border-t border-line px-4 pb-4 pl-14 pt-3 text-sm`}>
        <p className="text-muted">{s.description}</p>
        {after.length > 0 && <p className="mt-2 text-xs text-muted">After step {after.join(', ')}</p>}
        {s.documents.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {s.documents.map((d) => <li key={d} className="rounded-md bg-paper px-2 py-1 text-xs">{d}</li>)}
          </ul>
        )}
        {s.source_url && (
          <a href={s.source_url} target="_blank" rel="noreferrer" className={`mt-3 inline-block text-xs font-medium hover:underline ${s.official ? 'text-brand' : 'text-accent'}`}>
            {s.official ? 'Official source' : `Unofficial source; check with ${student ? 'your DSO' : 'the board'}`}: {hostOf(s.source_url)} ↗
          </a>
        )}
      </div>
    </li>
  )
}

function Warnings({ warnings }) {
  const [all, setAll] = useState(false)
  const shown = all ? warnings : warnings.slice(0, 3)
  return (
    <section className="print-break rounded-2xl border border-amber-200 bg-accent-soft p-5">
      <h3 className="text-sm font-semibold">Watch out for</h3>
      <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm">
        {shown.map((w) => <li key={w}>{w}</li>)}
      </ul>
      {warnings.length > 3 && (
        <button onClick={() => setAll(!all)} className="no-print mt-2 text-sm font-medium text-accent hover:underline">
          {all ? 'Show less' : `Show ${warnings.length - 3} more`}
        </button>
      )}
    </section>
  )
}

const DAY = 24 * 60 * 60 * 1000
const fmtDate = (iso) => new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

function countdown(d) {
  const now = new Date()
  const end = d.end && new Date(d.end + 'T23:59:59')
  const start = d.start && new Date(d.start + 'T00:00:00')
  if (end && end < now) return { text: 'Passed', tone: 'bg-paper text-muted' }
  if (start && start > now) {
    const days = Math.ceil((start - now) / DAY)
    return { text: `in ${days} day${days === 1 ? '' : 's'}`, tone: 'bg-brand-soft text-brand-dark' }
  }
  if (end) {
    const days = Math.ceil((end - now) / DAY)
    return { text: start ? `open · ${days} days left` : `in ${days} days`, tone: 'bg-accent-soft text-accent' }
  }
  return null
}

function Deadlines({ deadlines }) {
  const dated = deadlines.filter((d) => d.start || d.end)
  const rules = deadlines.filter((d) => !d.start && !d.end)
  return (
    <section className="print-break space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">Calculated from your program dates using the F-1 rules. Your calendar reminds you a week and a day before each one.</p>
        {dated.length > 0 && (
          <button type="button" onClick={() => downloadIcs(deadlines)}
            className="no-print rounded-lg border border-line bg-card px-3 py-2 text-sm font-medium transition hover:border-brand hover:text-brand">
            Add to calendar with reminders
          </button>
        )}
      </div>
      <ol className="relative space-y-3 border-l border-line pl-5">
        {dated.map((d) => {
          const c = countdown(d)
          return (
            <li key={d.label} className="relative">
              <span className="absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full bg-brand ring-4 ring-paper" />
              <details className="group rounded-2xl border border-line bg-card p-4">
                <summary className="flex cursor-pointer list-none flex-wrap items-baseline justify-between gap-2">
                  <span>
                    <span className="font-medium">{d.label}</span>
                    <span className="mt-0.5 block font-mono text-xs text-muted">
                      {d.start && d.end ? `${fmtDate(d.start)} – ${fmtDate(d.end)}` : fmtDate(d.end || d.start)}
                      {d.approximate && ' · usual dates'}
                    </span>
                  </span>
                  {c && <span className={`rounded-full px-2.5 py-0.5 font-mono text-xs ${c.tone}`}>{c.text}</span>}
                </summary>
                <p className="mt-3 text-sm text-muted">{d.detail}</p>
              </details>
            </li>
          )
        })}
      </ol>
      {rules.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {rules.map((d) => (
            <div key={d.label} className="rounded-2xl border border-line bg-card p-4">
              <p className="text-sm font-medium">{d.label}</p>
              <p className="mt-1 text-sm text-muted">{d.detail}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function H1BChances({ seasons }) {
  return (
    <section className="print-break rounded-2xl border border-line bg-card p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-lg font-semibold">H-1B lottery chances</h3>
        <span className="font-display text-3xl font-semibold text-brand">{seasons.length}</span>
      </div>
      <p className="mt-1 text-sm text-muted">One try each March while your F-1 work time lasts. Your employer registers you.</p>
      <ol className="mt-4 flex flex-wrap gap-2">
        {seasons.map((s, i) => (
          <li key={s.label} className={`rounded-lg px-3 py-1.5 font-mono text-xs ${i === 0 ? 'bg-ink text-white' : 'bg-paper text-ink'}`} title={s.note}>
            {s.label}
          </li>
        ))}
      </ol>
      <p className="mt-5 text-sm">Higher wage level, more entries <span className="text-muted">(weighted lottery, in effect)</span></p>
      <div className="mt-2 grid grid-cols-4 gap-2">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="text-center">
            <div className="flex h-12 items-end justify-center">
              <div className="w-full rounded-md bg-brand" style={{ height: `${n * 25}%`, opacity: 0.4 + n * 0.15 }} />
            </div>
            <p className="mt-1 font-mono text-[11px] text-muted">Level {['I', 'II', 'III', 'IV'][n - 1]} · {n}×</p>
          </div>
        ))}
      </div>
      <a href="https://www.federalregister.gov/documents/2025/12/29/2025-23853/weighted-selection-process-for-registrants-and-petitioners-seeking-to-file-cap-subject-h-1b"
        target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs font-medium text-brand hover:underline">
        Official source: federalregister.gov ↗
      </a>
    </section>
  )
}

const STATUS_TONE = {
  'in effect': 'bg-brand text-white',
  proposed: 'bg-accent-soft text-accent',
  'blocked by court': 'bg-slate-200 text-ink',
  'struck down': 'bg-slate-100 text-muted line-through',
}

function PolicyWatch({ policy }) {
  return (
    <section className="print-break">
      <p className="mb-3 text-sm text-muted">Recent changes and where each one stands today.</p>
      <ul className="divide-y divide-line rounded-2xl border border-line bg-card">
        {policy.map((p) => (
          <li key={p.title}>
            <details className="group p-4">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
                <span className="text-sm font-medium">{p.title}</span>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_TONE[p.status] || 'bg-paper'}`}>
                  {p.status[0].toUpperCase() + p.status.slice(1)}
                </span>
              </summary>
              <p className="mt-2 font-mono text-xs text-muted">{p.date}</p>
              <p className="mt-1 text-sm text-muted">{p.summary}</p>
              <a href={p.source_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-medium text-brand hover:underline">
                {hostOf(p.source_url)} ↗
              </a>
            </details>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Fold({ title, note, children }) {
  return (
    <details className="print-break rounded-2xl border border-line bg-card p-4">
      <summary className="cursor-pointer text-sm font-medium">{title}</summary>
      {note && <p className="mt-1 text-xs text-muted">{note}</p>}
      <div className="mt-3">{children}</div>
    </details>
  )
}

function LinkList({ items, dated }) {
  return (
    <ul className="space-y-1.5 text-sm">
      {items.map((s) => (
        <li key={s.url}>
          <a href={s.url} target="_blank" rel="noreferrer" className="text-brand hover:underline">{s.title || s.url}</a>
          <span className="font-mono text-xs text-muted">
            {' '}· {hostOf(s.url)}
            {dated && s.published ? ` · ${new Date(s.published).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}
            {!dated && s.official ? ' · official' : ''}
          </span>
        </li>
      ))}
    </ul>
  )
}

function Stat({ label, value, className = '' }) {
  return (
    <div className={`rounded-xl border border-white/10 bg-white/5 p-3 ${className}`}>
      <dt className="font-mono text-[11px] uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  )
}
