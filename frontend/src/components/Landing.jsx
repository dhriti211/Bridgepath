import { useState } from 'react'
import { EXAMPLES, STUDENT_EXAMPLES } from '../data'
import HeroArt from './HeroArt'
import IntakeForm from './IntakeForm'
import StudentForm from './StudentForm'

const STEPS = [
  ['Tell us where you are', 'Your degree, major, program end date and the job you want. Add your resume for a sharper plan.'],
  ['Pick a goal', 'Nemotron reads your background and suggests three realistic goals, from big tech to cap-exempt employers.'],
  ['Get your roadmap', 'Your OPT, STEM OPT and H-1B dates, plus ordered steps, each linked to USCIS or another official source.'],
  ['Track and ask', 'Tick off steps as you go, ask follow-up questions, and download a PDF checklist.'],
]

const AUDIENCES = [
  { key: 'tech', mode: 'student', example: 0, title: 'Students in tech', icon: '💻', text: 'Software, data and AI students planning OPT, STEM OPT and an H-1B, and looking for employers that sponsor.' },
  { key: 'eng', mode: 'student', example: 2, title: 'Engineering students', icon: '⚙️', text: 'Mechanical, civil, electrical and other engineering majors turning an F-1 degree into a US career.' },
  { key: 'pro', mode: 'license', example: 0, title: 'Professionals trained abroad', icon: '🩺', text: 'Nurses, engineers and teachers with a foreign degree who need a US license to work in their field again.' },
]

const FAQ = [
  ['Is Bridgepath free?', 'Yes. It is an open-source project built for the Nebius x NVIDIA Global AI Hackathon.'],
  ['Where does the information come from?', 'Each roadmap is built from a live search of USCIS, Study in the States, the Department of Labor, state boards and exam bodies. Your key F-1 dates are calculated from the regulations. Every step shows whether it is backed by an official source, an unofficial one, or none, so you know what to double-check.'],
  ['Is this legal or immigration advice?', 'No. Bridgepath helps you understand the process and prepare good questions. Confirm every step with your DSO, and talk to an immigration attorney for anything beyond OPT.'],
  ['How do you pick my goals?', 'Nemotron reads your degree, skills and experience (from the form and your resume) and suggests three different, realistic goals. You choose one, or type your own, before any plan is made.'],
  ['Do you store my resume?', 'No. Your resume is read once to build your profile and is not saved.'],
  ['Who is it for?', 'International (F-1) students in tech and engineering first, and also nurses, engineers and K-12 teachers with a foreign degree who need a US license.'],
]

export default function Landing({ onLicense, onStudent, suggesting }) {
  const [mode, setMode] = useState('student')
  const [preset, setPreset] = useState({ n: 0, form: null })

  function pick(a) {
    const ex = (a.mode === 'student' ? STUDENT_EXAMPLES : EXAMPLES)[a.example]
    setMode(a.mode)
    setPreset((p) => ({ n: p.n + 1, form: ex?.form ?? null }))
    document.getElementById('start')?.scrollIntoView({ behavior: 'smooth' })
  }

  function switchMode(m) {
    setMode(m)
    setPreset((p) => ({ n: p.n + 1, form: null }))
  }

  return (
    <main>
      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-12 pt-10 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pb-20 lg:pt-16">
        <div className="fade-up">
          <p className="mb-5 inline-flex w-fit items-center gap-2 rounded-full bg-accent-soft px-3 py-1 text-sm font-medium text-accent">
            <span className="h-2 w-2 rounded-full bg-accent" /> For international students, by an international student
          </p>
          <h1 className="font-display text-5xl leading-[1.05] tracking-tight sm:text-6xl">
            Study here. <span className="text-brand">Build your career here.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
            OPT, STEM OPT, H-1B: the rules keep changing and the answers are scattered. Bridgepath reads the
            official sources live and turns them into your personal plan, with your key dates, the steps in
            order, and employers that are more likely to sponsor.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#start" className="rounded-full bg-brand px-6 py-3 font-medium text-white shadow-lg shadow-brand/20 transition hover:-translate-y-0.5 hover:bg-brand-dark">
              Build my roadmap
            </a>
            <a href="#how" className="rounded-full border border-line bg-card px-6 py-3 font-medium text-ink transition hover:-translate-y-0.5 hover:border-brand">
              How it works
            </a>
          </div>
          <p className="mt-6 text-sm text-muted">
            Free · No sign-up · Every step linked to its source ·{' '}
            <button onClick={() => { switchMode('license'); document.getElementById('start')?.scrollIntoView({ behavior: 'smooth' }) }}
              className="underline decoration-line underline-offset-2 hover:text-brand">Trained abroad? We cover licensing too</button>
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-lg">
          <HeroArt />
          <FloatChip className="left-0 top-[18%]" delay="0s">✓ OPT approved</FloatChip>
          <FloatChip className="right-0 top-[8%]" delay="1.2s">📅 STEM OPT filed</FloatChip>
          <FloatChip className="bottom-[14%] right-2" delay="2.4s" strong>🎉 Offer from a sponsor</FloatChip>
        </div>
      </section>

      {/* Stats band */}
      <section className="bg-brand text-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:grid-cols-3 sm:px-6">
          {[
            ['1.18 million', 'international students in the US in 2024/25, 57% of them in STEM', 'IIE Open Doors 2025'],
            ['294,000+', 'on OPT after graduating, up 21% in a year', 'IIE Open Doors 2025'],
            ['2 million', 'college-educated immigrants unemployed or working below their skills', 'Migration Policy Institute, 2021'],
          ].map(([n, t, src]) => (
            <div key={n}>
              <p className="font-display text-4xl">{n}</p>
              <p className="mt-1 text-sm text-white/80">{t}</p>
              <p className="mt-1 text-xs text-white/60">{src}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 lg:py-24">
        <h2 className="font-display text-3xl sm:text-4xl">How it works</h2>
        <p className="mt-2 max-w-2xl text-muted">From "what do I do after graduation?" to a clear, sourced plan in about a minute.</p>
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
          <p className="mt-2 max-w-2xl text-muted">Pick one to start with a ready-made example you can edit.</p>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {AUDIENCES.map((p) => (
              <button key={p.key} onClick={() => pick(p)}
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
          <div role="tablist" className="mt-5 inline-flex rounded-full border border-line bg-card p-1 text-sm">
            {[['student', 'International student'], ['license', 'Trained abroad']].map(([m, label]) => (
              <button key={m} role="tab" aria-selected={mode === m} onClick={() => switchMode(m)}
                className={`rounded-full px-4 py-2 font-medium transition ${mode === m ? 'bg-brand text-white shadow' : 'text-muted hover:text-ink'}`}>
                {label}
              </button>
            ))}
          </div>
          <p className="mt-4 text-muted">
            {mode === 'student'
              ? 'For F-1 students and graduates on OPT. We suggest goals that fit you, then plan the one you pick.'
              : 'For nurses, engineers and K-12 teachers with a foreign degree who want a US license.'}
            {' '}Anything you add under "anything else" is used exactly as you write it.
          </p>
          <ul className="mt-6 space-y-3 text-sm">
            {[
              ['Personal', 'Built from your degree, dates, skills and goal.'],
              ['Sourced', 'Every step shows the official site it came from.'],
              ['Practical', 'Deadlines, costs, documents, and where to look for work.'],
            ].map(([t, d]) => (
              <li key={t} className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs text-brand">✓</span>
                <span><strong className="font-semibold">{t}.</strong> <span className="text-muted">{d}</span></span>
              </li>
            ))}
          </ul>
        </div>
        {mode === 'student'
          ? <StudentForm key={`s${preset.n}`} initial={preset.form} onSubmit={onStudent} busy={suggesting} />
          : <IntakeForm key={`l${preset.n}`} initial={preset.form} onSubmit={onLicense} />}
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
