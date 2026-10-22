import { STEP_LABELS, STEP_MODELS } from '../data'
import { hostOf } from '../util'

const ORDER = {
  license: ['intake', 'equivalency', 'research', 'synthesis', 'plan', 'verify'],
  student: ['intake', 'dates', 'research', 'policy', 'synthesis', 'plan', 'verify'],
}

export default function AgentFeed({ mode = 'license', steps, sources, compact }) {
  return (
    <div className="rounded-2xl border border-line bg-card p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">How we built your plan</h3>
      <ol className="space-y-3">
        {ORDER[mode].map((key) => {
          const s = steps[key]
          const status = s?.status || 'waiting'
          return (
            <li key={key} className="flex gap-3">
              <StatusDot status={status} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className={`text-sm font-medium ${status === 'waiting' ? 'text-muted' : 'text-ink'}`}>
                    {STEP_LABELS[key]}
                  </span>
                  <span className="rounded bg-paper px-1.5 py-0.5 text-[11px] text-muted">{STEP_MODELS[key]}</span>
                </div>
                {s?.message && <p className="mt-0.5 text-sm text-muted">{s.message}</p>}
                {key === 'research' && !compact && sources.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {sources.slice(0, 8).map((src) => (
                      <li key={src.url} className="truncate text-xs">
                        <a href={src.url} target="_blank" rel="noreferrer" className="text-brand hover:underline">
                          {hostOf(src.url)}
                        </a>
                        <span className="text-muted"> · {src.title}</span>
                      </li>
                    ))}
                    {sources.length > 8 && <li className="text-xs text-muted">and {sources.length - 8} more</li>}
                  </ul>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function StatusDot({ status }) {
  if (status === 'done')
    return (
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand text-white">
        <svg viewBox="0 0 20 20" className="h-3 w-3" fill="currentColor"><path d="M7.6 13.2 4.4 10l-1.2 1.2 4.4 4.4 9.2-9.2-1.2-1.2z" /></svg>
      </span>
    )
  if (status === 'running')
    return <span className="mt-0.5 h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-brand-soft border-t-brand" />
  return <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 border-line" />
}

