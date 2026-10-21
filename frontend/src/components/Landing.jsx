import { useState } from 'react'
import { EXAMPLES } from '../data'
import HeroArt from './HeroArt'
import IntakeForm from './IntakeForm'

const STEPS = [
  ['Tell us your story', 'Your profession, where you trained, your degree and the state you want to work in. A CV helps but is optional.'],
  ['Watch the agent research', 'Nemotron plans the search and Tavily reads the state board, exam and evaluation sites live.'],
  ['Get your roadmap', 'Ordered steps with costs, timelines, documents and a link to the official source for each one.'],
  ['Track your progress', 'Tick off steps as you go, ask follow-up questions, and download a PDF checklist.'],
]

const PROFESSIONS = [
  { key: 'nurse', title: 'Registered nurses', icon: '🩺', text: 'Credential evaluation, NCLEX-RN, English requirements and your state board application.' },
  { key: 'engineer', title: 'Engineers', icon: '📐', text: 'Degree evaluation, FE and PE exams, experience records and the path to a PE license.' },
  { key: 'teacher', title: 'K-12 teachers', icon: '📚', text: 'Transcript evaluation, subject exams, fingerprinting and your state teaching certificate.' },
]

const FAQ = [
  ['Is Bridgepath free?', 'Yes. It is an open-source project built for the Nebius x NVIDIA Global AI Hackathon.'],
  ['Where does the information come from?', 'Each roadmap is built from a live search of official state boards, exam bodies and evaluation services. Every step shows whether it is backed by an official source, an unofficial one, or none, so you know what to double-check.'],
  ['Is this legal or immigration advice?', 'No. Bridgepath is guidance to help you understand the process. Always confirm details with the licensing board linked on each step.'],
  ['Do you store my CV?', 'No. Your CV is read once to build your profile and is not saved.'],
  ['Which states and professions are covered?', 'Registered nurses, engineers and K-12 teachers, in any US state. More professions are on the way.'],
]

export default function Landing({ onSubmit }) {
  const [preset, setPreset] = useState({ n: 0, form: null })

  function pick(profession) {
    const ex = EXAMPLES.find((e) => e.form.profession === profession)
    setPreset((p) => ({ n: p.n + 1, form: ex?.form ?? null }))
    document.getElementById('start')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <main>
      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-12 pt-10 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pb-20 lg:pt-16">
        <div className="fade-up">
          <p className="mb-5 inline-flex w-fit items-center gap-2 rounded-full bg-accent-soft px-3 py-1 text-sm font-medium text-accent">
            <span className="h-2 w-2 rounded-full bg-accent" /> For professionals trained abroad
          </p>
          <h1 className="font-display text-5xl leading-[1.05] tracking-tight sm:text-6xl">
            Your degree <span className="text-brand">still counts.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
            Bridgepath reads the official licensing rules for your state and turns them into a personal,
            step-by-step plan back to your profession, with costs, timelines and sources.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#start" className="rounded-full bg-brand px-6 py-3 font-medium text-white shadow-lg shadow-brand/20 transition hover:-translate-y-0.5 hover:bg-brand-dark">
              Build my roadmap
            </a>
            <a href="#how" className="rounded-full border border-line bg-card px-6 py-3 font-medium text-ink transition hover:-translate-y-0.5 hover:border-brand">
              How it works
            </a>
          </div>
          <p className="mt-6 text-sm text-muted">Free · No sign-up · Every step linked to its source</p>
        </div>

        <div className="relative mx-auto w-full max-w-lg">
          <HeroArt />
          <FloatChip className="left-0 top-[18%]" delay="0s">✓ Credentials evaluated</FloatChip>
          <FloatChip className="right-0 top-[8%]" delay="1.2s">📝 NCLEX scheduled</FloatChip>
          <FloatChip className="bottom-[14%] right-2" delay="2.4s" strong>🎉 License approved</FloatChip>
        </div>
      </section>

      {/* Stats band */}
      <section className="bg-brand text-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:grid-cols-3 sm:px-6">
          {[
            ['2 million', 'college-educated immigrants in the US are unemployed or working below their skills'],
            ['$40 billion', 'in wages lost every year to this "brain waste"'],
            ['50 states', 'each with its own boards, exams, fees and rules'],
          ].map(([n, t]) => (
            <div key={n}>
              <p className="font-display text-4xl">{n}</p>
              <p className="mt-1 text-sm text-white/80">{t}</p>
            </div>
          ))}
        </div>
        <p className="mx-auto max-w-6xl px-4 pb-6 text-xs text-white/60 sm:px-6">Source: Migration Policy Institute, 2021.</p>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 lg:py-24">
        <h2 className="font-display text-3xl sm:text-4xl">How it works</h2>
        <p className="mt-2 max-w-2xl text-muted">From a foreign degree to a clear plan in about a minute.</p>
        <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(([t, d], i) => (
            <li key={t} className="group rounded-2xl border border-line bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:border-brand hover:shadow-md">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft font-display text-lg font-semibold text-brand transition group-hover:bg-brand group-hover:text-white">
                {i + 1}
              </span>
              <h3 className="mt-4 font-semibold">{t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Professions */}
      <section className="bg-brand-soft/60">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          <h2 className="font-display text-3xl sm:text-4xl">Who it's for</h2>
          <p className="mt-2 max-w-2xl text-muted">Pick your profession to start with a ready-made example you can edit.</p>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {PROFESSIONS.map((p) => (
              <button key={p.key} onClick={() => pick(p.key)}
                className="group rounded-2xl border border-line bg-card p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-brand hover:shadow-md">
                <span className="text-3xl">{p.icon}</span>
                <h3 className="mt-3 font-semibold">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{p.text}</p>
                <span className="mt-4 inline-block text-sm font-medium text-brand">
                  Try it <span className="inline-block transition group-hover:translate-x-1">→</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Form */}
      <section id="start" className="mx-auto grid max-w-6xl scroll-mt-20 gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:py-24">
        <div>
          <h2 className="font-display text-3xl sm:text-4xl">Build your roadmap</h2>
          <p className="mt-3 text-muted">
            The more you tell us, the more personal your plan. Anything you add under "anything else" is used
            exactly as you write it.
          </p>
          <ul className="mt-6 space-y-3 text-sm">
            {[
              ['Personal', 'Built from your degree, country, experience and state.'],
              ['Sourced', 'Every step shows the official board or exam site it came from.'],
              ['Practical', 'Costs, time, documents, and jobs you can do while you relicense.'],
            ].map(([t, d]) => (
              <li key={t} className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs text-brand">✓</span>
                <span><strong className="font-semibold">{t}.</strong> <span className="text-muted">{d}</span></span>
              </li>
            ))}
          </ul>
        </div>
        <IntakeForm key={preset.n} initial={preset.form} onSubmit={onSubmit} />
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
        <h2 className="font-display text-3xl sm:text-4xl">Questions</h2>
        <div className="mt-6 divide-y divide-line rounded-2xl border border-line bg-card">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                {q}
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  )
}

function FloatChip({ children, className, delay, strong }) {
  return (
    <div style={{ animationDelay: delay }}
      className={`float absolute rounded-full px-3.5 py-2 text-sm font-medium shadow-lg ${strong ? 'bg-brand text-white' : 'bg-card text-ink'} ${className}`}>
      {children}
    </div>
  )
}
