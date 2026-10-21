import { useState } from 'react'

export default function GoalPicker({ profile, goals, onPick, onBack }) {
  const [custom, setCustom] = useState('')

  function pickCustom(e) {
    e.preventDefault()
    if (!custom.trim()) return
    onPick({ id: 'custom', title: custom.trim(), why: 'Your own goal.', visa_path: '' })
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:py-16">
      <div className="fade-up">
        <p className="text-sm font-medium text-brand">Step 2 of 3</p>
        <h1 className="mt-1 font-display text-3xl sm:text-4xl">Pick the goal to plan for</h1>
        {profile?.summary && <p className="mt-3 max-w-2xl text-muted">{profile.summary}</p>}
        {profile?.skills?.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {profile.skills.slice(0, 12).map((s) => (
              <li key={s} className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-medium text-brand-dark">{s}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {goals.map((g, i) => (
          <button key={g.id} onClick={() => onPick(g)} style={{ animationDelay: `${i * 100}ms` }}
            className="fade-up group flex flex-col rounded-2xl border border-line bg-card p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-brand hover:shadow-md">
            <span className="text-xs font-semibold uppercase tracking-wide text-accent">Option {i + 1}</span>
            <h2 className="mt-2 font-semibold leading-snug">{g.title}</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{g.why}</p>
            <p className="mt-4 rounded-lg bg-paper px-3 py-2 text-xs font-medium text-ink">{g.visa_path}</p>
            <span className="mt-4 text-sm font-medium text-brand">
              Plan this <span className="inline-block transition group-hover:translate-x-1">→</span>
            </span>
          </button>
        ))}
      </div>

      <form onSubmit={pickCustom} className="mt-6 flex flex-col gap-2 rounded-2xl border border-dashed border-line bg-card p-4 sm:flex-row sm:items-center">
        <label className="flex-1">
          <span className="sr-only">Your own goal</span>
          <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Or type your own goal, e.g. ML engineer at a university lab"
            className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand" />
        </label>
        <button className="rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-dark">Plan my goal</button>
      </form>

      <button onClick={onBack} className="mt-6 text-sm text-muted hover:text-ink">← Change my details</button>
    </main>
  )
}
