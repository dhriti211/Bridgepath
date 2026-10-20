import { hostOf } from '../util'

const usd = (n) => '$' + Math.round(n).toLocaleString('en-US')
const range = (a, b, fmt = (x) => x) => (Math.round(a) === Math.round(b) ? fmt(a) : `${fmt(a)} to ${fmt(b)}`)
const months = (w) => Math.max(1, Math.round(w / 4.33))

export default function Roadmap({ roadmap, profile }) {
  const { steps } = roadmap
  const index = Object.fromEntries(steps.map((s, i) => [s.id, i + 1]))

  return (
    <div className="space-y-6">
      <section className="print-break rounded-2xl bg-brand p-6 text-white shadow-sm sm:p-8">
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
        <h3 className="mb-4 font-display text-xl">Your steps</h3>
        <ol className="relative space-y-4 border-l-2 border-brand-soft pl-6 sm:ml-3">
          {steps.map((s, i) => (
            <li key={s.id} className="print-break relative">
              <span className="absolute -left-[37px] flex h-7 w-7 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white ring-4 ring-paper">
                {i + 1}
              </span>
              <div className="rounded-xl border border-line bg-card p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h4 className="font-semibold text-ink">{s.title}</h4>
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
              </div>
            </li>
          ))}
        </ol>
      </section>

      {roadmap.bridge_jobs.length > 0 && (
        <section className="print-break">
          <h3 className="mb-1 font-display text-xl">Work you can do now</h3>
          <p className="mb-4 text-sm text-muted">Jobs that use your skills and build US experience while you get licensed.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {roadmap.bridge_jobs.map((j) => (
              <div key={j.title} className="rounded-xl border border-line bg-card p-4 shadow-sm">
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
