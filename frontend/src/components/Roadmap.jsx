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
  const visa = steps.filter((s) => s.kind !== 'career')
  const officialCount = visa.filter((s) => s.official).length
  const sections = [
    roadmap.deadlines?.length && ['dates', 'Key dates'],
    roadmap.h1b_seasons?.length && ['h1b', 'H-1B chances'],
    ['steps', 'Steps'],
    roadmap.bridge_jobs.length && ['employers', student ? 'Employers' : 'Jobs now'],
    roadmap.warnings.length && ['warnings', 'Watch out'],
    (roadmap.policy?.length || roadmap.news?.length) && ['policy', 'Policy watch'],
  ].filter(Boolean)
  const count = steps.filter((s) => done.includes(s.id)).length
  const pct = steps.length ? Math.round((count / steps.length) * 100) : 0

  return (
    <div className="space-y-6">
      <section className="fade-up print-break rounded-3xl bg-gradient-to-br from-brand to-brand-dark p-6 text-white shadow-sm sm:p-8">
        <p className="text-sm font-medium text-white/80">
          {student
            ? `Your plan as a ${profile?.degree_level} ${profile?.major} graduate → ${profile?.target_role}`
            : `Your path as a ${profile?.degree} holder from ${profile?.country} → ${profile?.target_state}`}
        </p>
        <h2 className="mt-2 font-display text-2xl leading-snug sm:text-3xl">{roadmap.headline}</h2>
        <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat label="Estimated cost" value={range(roadmap.total_cost_usd_min, roadmap.total_cost_usd_max, usd)} />
          <Stat label="Estimated time" value={`${range(months(roadmap.total_weeks_min), months(roadmap.total_weeks_max))} months`} />
          {roadmap.us_equivalent && (
            <Stat label={student ? 'Visa path' : 'US equivalent'} value={roadmap.us_equivalent} className="col-span-2 sm:col-span-1" />
          )}
        </dl>
        {visa.length > 0 && (
          <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm">
            ✓ {officialCount} of {visa.length} {student ? 'visa' : 'licensing'} steps linked to an official source
          </p>
        )}
      </section>

      <nav aria-label="Roadmap sections" className="no-print -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {sections.map(([id, label]) => (
          <a key={id} href={`#${id}`}
            className="shrink-0 rounded-full border border-line bg-card px-3.5 py-1.5 text-sm font-medium text-ink transition hover:border-brand hover:text-brand">
            {label}
          </a>
        ))}
      </nav>

      {roadmap.deadlines?.length > 0 && <Deadlines deadlines={roadmap.deadlines} />}

      {roadmap.h1b_seasons?.length > 0 && <H1BChances seasons={roadmap.h1b_seasons} />}

      <section id="steps" className="scroll-mt-20">
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
                      . Double-check with {student ? 'USCIS or your DSO' : 'the state board'}.
                    </span>
                  ) : s.kind === 'career' ? (
                    <span className="text-muted">Career step: no official rule needed.</span>
                  ) : (
                    <span className="text-accent">No source found for this step. Confirm with {student ? 'your DSO' : 'the state board'}.</span>
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
        <section id="employers" className="print-break scroll-mt-20">
          <h3 className="mb-1 font-display text-xl">{student ? 'Employers to target' : 'Work you can do now'}</h3>
          <p className="mb-4 text-sm text-muted">
            {student
              ? 'Where your odds of sponsorship are better for this goal. Pay ranges are rough estimates.'
              : 'Jobs that use your skills and build US experience while you get licensed.'}
          </p>
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
        <section id="warnings" className="print-break scroll-mt-20 rounded-xl border border-accent/30 bg-accent-soft p-5">
          <h3 className="mb-2 font-semibold text-ink">Watch out for</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm text-ink">
            {roadmap.warnings.map((w) => <li key={w}>{w}</li>)}
          </ul>
        </section>
      )}

      {(roadmap.policy?.length > 0 || roadmap.news?.length > 0) && <PolicyWatch policy={roadmap.policy || []} news={roadmap.news || []} />}

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
        {student
          ? 'Bridgepath gives guidance, not legal or immigration advice. Rules change; confirm every step with your DSO, and talk to an immigration attorney for anything beyond OPT.'
          : 'Bridgepath gives guidance, not legal advice. Rules change; always confirm with the official licensing board.'}
      </p>
    </div>
  )
}

const DAY = 24 * 60 * 60 * 1000
const fmtDate = (iso) => new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

function countdown(d) {
  const now = new Date()
  const end = d.end && new Date(d.end + 'T23:59:59')
  const start = d.start && new Date(d.start + 'T00:00:00')
  if (end && end < now) return { text: 'Passed', tone: 'bg-line text-muted' }
  if (start && start > now) {
    const days = Math.ceil((start - now) / DAY)
    return { text: `Opens in ${days} day${days === 1 ? '' : 's'}`, tone: 'bg-brand-soft text-brand-dark' }
  }
  if (end) {
    const days = Math.ceil((end - now) / DAY)
    return { text: start ? `Open now · ${days} days left` : `In ${days} day${days === 1 ? '' : 's'}`, tone: 'bg-accent-soft text-accent' }
  }
  return null
}

function Deadlines({ deadlines }) {
  return (
    <section id="dates" className="print-break scroll-mt-20">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="mb-1 font-display text-xl">Your key dates</h3>
          <p className="text-sm text-muted">Worked out from your program dates using the F-1 rules.</p>
        </div>
        {deadlines.some((d) => d.start || d.end) && (
          <button type="button" onClick={() => downloadIcs(deadlines)}
            className="no-print rounded-full border border-line bg-card px-4 py-2 text-sm font-medium text-ink transition hover:-translate-y-0.5 hover:border-brand hover:text-brand">
            📅 Add to my calendar
          </button>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {deadlines.map((d, i) => {
          const c = countdown(d)
          return (
            <div key={d.label} style={{ animationDelay: `${i * 80}ms` }}
              className="fade-up rounded-xl border border-line bg-card p-4 shadow-sm transition hover:border-brand/50 hover:shadow-md">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h4 className="font-semibold">{d.label}</h4>
                {c && <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${c.tone}`}>{c.text}</span>}
              </div>
              {(d.start || d.end) && (
                <p className="mt-1 text-sm font-medium text-brand">
                  {d.start && d.end ? `${fmtDate(d.start)} to ${fmtDate(d.end)}` : fmtDate(d.end || d.start)}
                  {d.approximate && <span className="font-normal text-muted"> (usual dates; check USCIS)</span>}
                </p>
              )}
              <p className="mt-2 text-sm leading-relaxed text-muted">{d.detail}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}

const WAGE_LEVELS = [
  ['Level I', 'Entry level', 1],
  ['Level II', 'Qualified', 2],
  ['Level III', 'Experienced', 3],
  ['Level IV', 'Fully competent', 4],
]

function H1BChances({ seasons }) {
  return (
    <section id="h1b" className="print-break scroll-mt-20 rounded-2xl border border-line bg-card p-5 shadow-sm sm:p-6">
      <h3 className="font-display text-xl">Your H-1B chances</h3>
      <p className="mt-1 text-sm text-muted">
        You can be entered in the H-1B lottery <strong className="text-ink">{seasons.length} time{seasons.length === 1 ? '' : 's'}</strong>{' '}
        while your F-1 work time lasts, if you use every OPT extension you qualify for. Each March is a new try, and your employer does the registering.
      </p>
      <ol className="mt-4 flex flex-wrap gap-2">
        {seasons.map((s, i) => (
          <li key={s.label} className={`rounded-xl px-3 py-2 text-sm ${i === 0 ? 'bg-brand text-white' : 'bg-brand-soft text-brand-dark'}`}>
            <span className="font-semibold">{s.label}</span>
            <span className={`block text-xs ${i === 0 ? 'text-white/80' : 'text-brand-dark/80'}`}>{s.note} · FY{s.fiscal_year}</span>
          </li>
        ))}
      </ol>
      <div className="mt-5">
        <p className="text-sm font-medium">Higher pay means more entries in the lottery</p>
        <p className="text-xs text-muted">Weighted selection by the job's wage level, in effect since the March 2026 season.</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {WAGE_LEVELS.map(([lvl, desc, n]) => (
            <div key={lvl} className="rounded-xl border border-line p-3">
              <p className="text-sm font-semibold">{lvl}</p>
              <p className="text-xs text-muted">{desc}</p>
              <p className="mt-2 flex gap-1" aria-label={`${n} entr${n === 1 ? 'y' : 'ies'}`}>
                {[1, 2, 3, 4].map((k) => (
                  <span key={k} className={`h-2.5 flex-1 rounded-full ${k <= n ? 'bg-brand' : 'bg-brand-soft'}`} />
                ))}
              </p>
              <p className="mt-1 text-xs font-medium text-brand-dark">{n} entr{n === 1 ? 'y' : 'ies'}</p>
            </div>
          ))}
        </div>
        <a href="https://www.federalregister.gov/documents/2025/12/29/2025-23853/weighted-selection-process-for-registrants-and-petitioners-seeking-to-file-cap-subject-h-1b"
          target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs font-medium text-brand hover:underline">
          ✓ Official source: federalregister.gov
        </a>
      </div>
    </section>
  )
}

const STATUS_TONE = {
  'in effect': 'bg-brand text-white',
  proposed: 'bg-accent-soft text-accent',
  'blocked by court': 'bg-line text-ink',
  'struck down': 'bg-line text-muted line-through',
}

function PolicyWatch({ policy, news }) {
  return (
    <section id="policy" className="print-break scroll-mt-20">
      <h3 className="mb-1 font-display text-xl">Policy watch</h3>
      <p className="mb-4 text-sm text-muted">Recent rule changes and where each one stands today, so you know what actually applies to you.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {policy.map((p) => (
          <div key={p.title} className="rounded-xl border border-line bg-card p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h4 className="font-semibold leading-snug">{p.title}</h4>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_TONE[p.status] || 'bg-line'}`}>{p.status[0].toUpperCase() + p.status.slice(1)}</span>
            </div>
            <p className="mt-1 text-xs text-muted">{p.date}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">{p.summary}</p>
            <a href={p.source_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-medium text-brand hover:underline">
              Source: {hostOf(p.source_url)}
            </a>
          </div>
        ))}
      </div>
      {news.length > 0 && (
        <div className="mt-5 rounded-xl border border-line bg-card p-4">
          <p className="text-sm font-semibold">In the news this month</p>
          <p className="text-xs text-muted">Found live by Tavily. News is not the rule; check the official link before acting.</p>
          <ul className="mt-3 space-y-2 text-sm">
            {news.slice(0, 5).map((n) => (
              <li key={n.url}>
                <a href={n.url} target="_blank" rel="noreferrer" className="text-brand hover:underline">{n.title || n.url}</a>
                <span className="text-muted"> · {hostOf(n.url)}{n.published ? ` · ${new Date(n.published).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
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
