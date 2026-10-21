import { useEffect, useRef, useState } from 'react'
import { streamRoadmap, streamStudentRoadmap, suggestGoals } from './api'
import AgentFeed from './components/AgentFeed'
import Chat from './components/Chat'
import GoalPicker from './components/GoalPicker'
import Landing from './components/Landing'
import Roadmap from './components/Roadmap'

export default function App() {
  const [phase, setPhase] = useState('form') // form | goals | running | done | error
  const [mode, setMode] = useState('student') // student | license
  const [suggesting, setSuggesting] = useState(false)
  const [goals, setGoals] = useState(null)
  const [steps, setSteps] = useState({})
  const [sources, setSources] = useState([])
  const [profile, setProfile] = useState(null)
  const [roadmap, setRoadmap] = useState(null)
  const [error, setError] = useState('')
  const [limited, setLimited] = useState(false)
  const abort = useRef(null)

  async function run(streamer) {
    setPhase('running'); setSteps({}); setSources([]); setRoadmap(null); setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
    abort.current = new AbortController()
    try {
      await streamer(handle, abort.current.signal)
    } catch (e) {
      if (e.name !== 'AbortError') { setError(e.message); setLimited(!!e.limit); setPhase('error') }
    }
  }

  function startLicense(formData) {
    setMode('license'); setProfile(null)
    run((onEvent, signal) => streamRoadmap(formData, onEvent, signal))
  }

  async function startStudent(formData) {
    setMode('student'); setSuggesting(true); setError('')
    abort.current = new AbortController()
    try {
      const res = await suggestGoals(formData, abort.current.signal)
      setProfile(res.profile); setGoals(res.goals); setPhase('goals')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e) {
      if (e.name !== 'AbortError') { setError(e.message); setLimited(!!e.limit); setPhase('error') }
    } finally {
      setSuggesting(false)
    }
  }

  function pickGoal(goal) {
    run((onEvent, signal) => streamStudentRoadmap({ profile, goal }, onEvent, signal))
  }

  function handle(ev) {
    if (ev.type === 'step') setSteps((s) => ({ ...s, [ev.step]: ev }))
    else if (ev.type === 'sources')
      setSources((prev) => [...prev, ...ev.sources.filter((n) => !prev.some((p) => p.url === n.url))])
    else if (ev.type === 'profile') setProfile(ev.profile)
    else if (ev.type === 'roadmap') { setRoadmap(ev.roadmap); setPhase('done') }
    else if (ev.type === 'error') { setError(ev.message); setLimited(!!ev.limit); setPhase('error') }
  }

  function reset() {
    abort.current?.abort()
    setSuggesting(false)
    setPhase('form')
  }

  return (
    <div className="min-h-screen">
      <header className="no-print sticky top-0 z-20 border-b border-line bg-paper/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <button onClick={reset} className="flex items-center gap-2">
            <Logo />
            <span className="font-display text-xl font-semibold">Bridgepath</span>
          </button>
          {phase === 'form' && (
            <nav className="flex items-center gap-1 text-sm sm:gap-4">
              <a href="#how" className="hidden rounded-full px-3 py-2 text-muted hover:text-ink sm:inline">How it works</a>
              <a href="#start" className="rounded-full bg-brand px-4 py-2 font-medium text-white hover:bg-brand-dark">Get started</a>
            </nav>
          )}
          {phase === 'done' && (
            <div className="flex gap-2">
              <button onClick={() => window.print()} className="rounded-lg border border-line bg-card px-3 py-2 text-sm font-medium hover:border-brand">Download PDF</button>
              <button onClick={reset} className="rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-dark">New roadmap</button>
            </div>
          )}
        </div>
      </header>

      {phase === 'form' ? (
        <Landing onLicense={startLicense} onStudent={startStudent} suggesting={suggesting} />
      ) : phase === 'goals' ? (
        <GoalPicker profile={profile} goals={goals} onPick={pickGoal} onBack={reset} />
      ) : (
        <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[320px_1fr]">
          <aside className="no-print space-y-6 lg:sticky lg:top-6 lg:self-start">
            <AgentFeed mode={mode} steps={steps} sources={sources} compact={phase === 'done'} />
          </aside>
          <section className="min-w-0 space-y-6">
            {phase === 'running' && <Waiting mode={mode} />}
            {phase === 'error' && (
              <div className={`rounded-2xl border p-6 ${limited ? 'border-accent/30 bg-accent-soft' : 'border-red-200 bg-red-50'}`}>
                <h2 className={`font-semibold ${limited ? 'text-ink' : 'text-red-800'}`}>{limited ? 'Demo limit reached' : 'Something went wrong'}</h2>
                <p className={`mt-1 text-sm ${limited ? 'text-ink' : 'text-red-700'}`}>{error}</p>
                <button onClick={reset} className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white">Try again</button>
              </div>
            )}
            {phase === 'done' && roadmap && (
              <>
                <Roadmap roadmap={roadmap} profile={profile} />
                <Chat profile={profile} roadmap={roadmap} />
              </>
            )}
          </section>
        </main>
      )}

      <footer className="no-print border-t border-line py-6 text-center text-xs text-muted">
        Powered by NVIDIA Nemotron on Nebius Token Factory, with live research by Tavily.
      </footer>
    </div>
  )
}

const TIPS = {
  student: [
    'On post-completion OPT you can be unemployed for at most 90 days in total, so plan your job search early.',
    'STEM OPT needs an employer enrolled in E-Verify. It is worth asking about before you accept an offer.',
    'Universities and many research nonprofits are cap-exempt: they can sponsor an H-1B without the lottery.',
  ],
  license: [
  'Most states accept more than one credential evaluation service. Your roadmap names the options your state accepts.',
  'Licensing fees and exam rules change. Every step links to the page it came from so you can check.',
  'You can often work in a related job while you relicense. Look for "Work you can do now" in your roadmap.',
  ],
}

function Waiting({ mode }) {
  const tips = TIPS[mode]
  const [tip, setTip] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setTip((i) => (i + 1) % tips.length), 6000)
    return () => clearInterval(t)
  }, [tips])
  return (
    <div className="fade-up rounded-3xl border border-line bg-card p-8 text-center shadow-sm sm:p-10">
      <div className="relative mx-auto h-14 w-14">
        <div className="absolute inset-0 animate-ping rounded-full bg-brand-soft" />
        <div className="relative h-14 w-14 animate-spin rounded-full border-4 border-brand-soft border-t-brand" />
      </div>
      <h2 className="mt-5 font-display text-2xl">Building your roadmap</h2>
      <p className="mt-1 text-sm text-muted">
        We're reading {mode === 'student' ? 'USCIS and other official sources' : 'official licensing sources'} for you. This takes about a minute.
      </p>
      <p key={tip} className="fade-up mx-auto mt-6 max-w-md rounded-xl bg-paper px-4 py-3 text-sm text-ink">
        <span className="font-medium text-brand">Did you know? </span>{tips[tip]}
      </p>
    </div>
  )
}

function Logo() {
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
      <rect width="32" height="32" rx="8" className="fill-brand" />
      <path d="M6 22c5-9 15-9 20 0" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  )
}
