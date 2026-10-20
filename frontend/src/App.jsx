import { useRef, useState } from 'react'
import { streamRoadmap } from './api'
import AgentFeed from './components/AgentFeed'
import Chat from './components/Chat'
import IntakeForm from './components/IntakeForm'
import Roadmap from './components/Roadmap'

export default function App() {
  const [phase, setPhase] = useState('form') // form | running | done | error
  const [steps, setSteps] = useState({})
  const [sources, setSources] = useState([])
  const [profile, setProfile] = useState(null)
  const [roadmap, setRoadmap] = useState(null)
  const [error, setError] = useState('')
  const abort = useRef(null)

  async function start(formData) {
    setPhase('running'); setSteps({}); setSources([]); setProfile(null); setRoadmap(null); setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
    abort.current = new AbortController()
    try {
      await streamRoadmap(formData, handle, abort.current.signal)
    } catch (e) {
      if (e.name !== 'AbortError') { setError(e.message); setPhase('error') }
    }
  }

  function handle(ev) {
    if (ev.type === 'step') setSteps((s) => ({ ...s, [ev.step]: ev }))
    else if (ev.type === 'sources')
      setSources((prev) => [...prev, ...ev.sources.filter((n) => !prev.some((p) => p.url === n.url))])
    else if (ev.type === 'profile') setProfile(ev.profile)
    else if (ev.type === 'roadmap') { setRoadmap(ev.roadmap); setPhase('done') }
    else if (ev.type === 'error') { setError(ev.message); setPhase('error') }
  }

  function reset() {
    abort.current?.abort()
    setPhase('form')
  }

  return (
    <div className="min-h-screen">
      <header className="no-print border-b border-line bg-paper/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <button onClick={reset} className="flex items-center gap-2">
            <Logo />
            <span className="font-display text-xl font-semibold">Bridgepath</span>
          </button>
          {phase === 'done' && (
            <div className="flex gap-2">
              <button onClick={() => window.print()} className="rounded-lg border border-line bg-card px-3 py-2 text-sm font-medium hover:border-brand">Download PDF</button>
              <button onClick={reset} className="rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-dark">New roadmap</button>
            </div>
          )}
        </div>
      </header>

      {phase === 'form' ? (
        <main className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:py-16">
          <Hero />
          <IntakeForm onSubmit={start} />
        </main>
      ) : (
        <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[320px_1fr]">
          <aside className="no-print space-y-6 lg:sticky lg:top-6 lg:self-start">
            <AgentFeed steps={steps} sources={sources} compact={phase === 'done'} />
          </aside>
          <section className="min-w-0 space-y-6">
            {phase === 'running' && <Waiting />}
            {phase === 'error' && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
                <h2 className="font-semibold text-red-800">Something went wrong</h2>
                <p className="mt-1 text-sm text-red-700">{error}</p>
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

function Hero() {
  return (
    <div className="flex flex-col justify-center">
      <p className="mb-4 inline-flex w-fit rounded-full bg-accent-soft px-3 py-1 text-sm font-medium text-accent">
        For nurses, engineers and teachers trained abroad
      </p>
      <h1 className="font-display text-4xl leading-tight sm:text-5xl">
        Your degree still counts. Here's your path back to your profession.
      </h1>
      <p className="mt-5 text-lg leading-relaxed text-muted">
        About 2 million college-educated immigrants in the US work below their training, often because
        the relicensing process is a maze. Bridgepath reads the official rules for your state and builds
        a step-by-step plan with costs, timelines and sources.
      </p>
      <ul className="mt-8 space-y-3 text-sm">
        {[
          ['Personal', 'Built from your degree, country, experience and state.'],
          ['Sourced', 'Every step links to the official board or exam site it came from.'],
          ['Practical', 'Costs, time, documents, and jobs you can do while you relicense.'],
        ].map(([t, d]) => (
          <li key={t} className="flex gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs text-brand">✓</span>
            <span><strong className="font-semibold">{t}.</strong> <span className="text-muted">{d}</span></span>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-xs text-muted">Source: Migration Policy Institute, 2021.</p>
    </div>
  )
}

function Waiting() {
  return (
    <div className="rounded-2xl border border-line bg-card p-8 text-center shadow-sm">
      <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-brand-soft border-t-brand" />
      <h2 className="mt-4 font-display text-xl">Building your roadmap</h2>
      <p className="mt-1 text-sm text-muted">We're reading official licensing sources for you. This takes about a minute.</p>
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
