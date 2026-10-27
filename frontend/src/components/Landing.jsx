import { useState } from 'react'
import IntakeForm from './IntakeForm'
import StudentForm from './StudentForm'

const STEPS = [
  ['01', 'Tell us where you are', 'Degree, graduation date and the job you want. A resume helps.'],
  ['02', 'Pick a goal', 'Nemotron suggests three realistic goals. You choose one.'],
  ['03', 'Get your plan', 'Your dates, steps and H-1B chances, each linked to its official source.'],
]

const FAQ = [
  ['Where does the information come from?', 'Rules are searched live on USCIS, DHS and the Federal Register, key dates are calculated from the F-1 regulations, and every step shows its source.'],
  ['Is this legal advice?', 'No. It helps you understand the process and prepare good questions. Confirm every step with your DSO.'],
  ['Do I need an account?', 'No. Your roadmaps are saved in this browser only, and your resume is never stored.'],
  ['Is it free?', 'Yes. Bridgepath is open source, built for the Nebius x NVIDIA Global AI Hackathon.'],
]

export default function Landing({ onLicense, onStudent, suggesting, saved, onOpenSaved, onDeleteSaved }) {
  const [mode, setMode] = useState('student')

  function start(m) {
    setMode(m)
    document.getElementById('start')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden bg-night text-white">
        <div className="grid-bg absolute inset-0" aria-hidden="true" />
        <div className="absolute inset-x-0 -top-40 mx-auto h-96 max-w-3xl rounded-full bg-brand/30 blur-3xl" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pb-28 lg:pt-24">
          <div className="fade-up">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 font-mono text-xs text-teal-200">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-300" /> AI agent for F-1 students
            </p>
            <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
              Your OPT and H-1B plan,{' '}
              <span className="bg-gradient-to-r from-teal-300 to-cyan-300 bg-clip-text text-transparent">built from today's rules.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-slate-300">
              Bridgepath reads USCIS and DHS live and turns them into your own dates, steps and lottery chances.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button onClick={() => start('student')}
                className="rounded-xl bg-brand px-6 py-3 font-medium text-white shadow-lg shadow-brand/30 transition hover:-translate-y-0.5 hover:bg-teal-500">
                Build my roadmap
              </button>
              <button onClick={() => start('license')} className="text-sm text-slate-300 underline-offset-4 hover:text-white hover:underline">
                Trained abroad? Get a licensing plan
              </button>
            </div>
            <dl className="mt-12 flex flex-wrap gap-x-10 gap-y-4">
              {[['1.18M', 'international students'], ['294K', 'working on OPT'], ['3', 'Nemotron models']].map(([n, t]) => (
                <div key={t}>
                  <dt className="font-display text-2xl font-semibold">{n}</dt>
                  <dd className="text-xs text-slate-400">{t}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-2 text-[11px] text-slate-500">Student numbers: IIE Open Doors 2025.</p>
          </div>
          <Preview />
        </div>
      </section>

      {saved.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-14 sm:px-6">
          <h2 className="font-display text-2xl font-semibold">My roadmaps</h2>
          <p className="mt-1 text-sm text-muted">Saved in this browser.</p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {saved.map((s) => (
              <li key={s.id} className="group flex min-w-0 items-start justify-between gap-3 rounded-2xl border border-line bg-card p-4 transition hover:border-brand">
                <button onClick={() => onOpenSaved(s)} className="min-w-0 flex-1 text-left">
                  <p className="truncate font-medium">{s.title}</p>
                  <p className="mt-1 font-mono text-xs text-muted">
                    {new Date(s.savedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {s.roadmap.steps.length} steps
                  </p>
                </button>
                <button onClick={() => onDeleteSaved(s.id)} aria-label={`Delete ${s.title}`}
                  className="rounded-lg px-2 text-muted opacity-60 hover:bg-paper hover:text-ink group-hover:opacity-100">✕</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 lg:py-20">
        <ol className="grid gap-4 md:grid-cols-3">
          {STEPS.map(([n, t, d]) => (
            <li key={n} className="rounded-2xl border border-line bg-card p-6">
              <span className="font-mono text-xs text-brand">{n}</span>
              <h3 className="mt-3 font-display text-lg font-semibold">{t}</h3>
              <p className="mt-1 text-sm text-muted">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Form */}
      <section id="start" className="mx-auto max-w-3xl scroll-mt-20 px-4 pb-16 sm:px-6">
        <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <h2 className="font-display text-3xl font-semibold">Build your roadmap</h2>
          <div role="tablist" className="inline-flex rounded-xl border border-line bg-card p-1 text-sm">
            {[['student', 'International student'], ['license', 'Trained abroad']].map(([m, label]) => (
              <button key={m} role="tab" aria-selected={mode === m} onClick={() => setMode(m)}
                className={`rounded-lg px-4 py-2 font-medium transition ${mode === m ? 'bg-ink text-white' : 'text-muted hover:text-ink'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
        {mode === 'student'
          ? <StudentForm onSubmit={onStudent} busy={suggesting} />
          : <IntakeForm onSubmit={onLicense} />}
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
        <div className="divide-y divide-line rounded-2xl border border-line bg-card">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                {q}
                <span className="text-muted transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-2 text-sm text-muted">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  )
}

// A small, static picture of what a roadmap looks like.
function Preview() {
  return (
    <div className="fade-up relative mx-auto w-full max-w-md" style={{ animationDelay: '150ms' }} aria-hidden="true">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur">
        <div className="flex items-center justify-between">
          <p className="font-mono text-xs text-slate-400">MS Computer Science → Software engineer</p>
          <span className="rounded-full bg-teal-400/15 px-2 py-0.5 font-mono text-[10px] text-teal-200">6/6 sourced</span>
        </div>
        <div className="mt-4 space-y-2.5">
          {[
            ['Ask your DSO to recommend OPT', 'Jan 15', 'Opens in 85 days'],
            ['File Form I-765 for OPT', 'Feb 14', '$470 online'],
            ['H-1B registration', 'Mar 2027', 'Chance 1 of 4'],
            ['STEM OPT extension', '2028', '+24 months'],
          ].map(([t, d, tag], i) => (
            <div key={t} className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5">
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[11px] ${i === 0 ? 'bg-teal-400 text-night' : 'bg-white/10 text-slate-300'}`}>{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-white">{t}</p>
                <p className="font-mono text-[11px] text-slate-400">{d}</p>
              </div>
              <span className="shrink-0 font-mono text-[11px] text-teal-200">{tag}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="float absolute -bottom-5 -left-4 rounded-xl border border-white/10 bg-night px-3 py-2 font-mono text-[11px] text-slate-300 shadow-xl">
        nemotron-ultra · planning
      </div>
    </div>
  )
}
