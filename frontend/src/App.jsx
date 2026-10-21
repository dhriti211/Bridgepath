import { useEffect, useRef, useState } from 'react'
import { streamRoadmap } from './api'
import AgentFeed from './components/AgentFeed'
import Chat from './components/Chat'
import Landing from './components/Landing'
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
        <Landing onSubmit={start} />
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

const TIPS = [
  'Most states accept more than one credential evaluation service. Your roadmap names the options your state accepts.',
  'Licensing fees and exam rules change. Every step links to the page it came from so you can check.',
  'You can often work in a related job while you relicense. Look for "Work you can do now" in your roadmap.',
]

function Waiting() {
  const [tip, setTip] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setTip((i) => (i + 1) % TIPS.length), 6000)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="fade-up rounded-3xl border border-line bg-card p-8 text-center shadow-sm sm:p-10">
      <div className="relative mx-auto h-14 w-14">
        <div className="absolute inset-0 animate-ping rounded-full bg-brand-soft" />
        <div className="relative h-14 w-14 animate-spin rounded-full border-4 border-brand-soft border-t-brand" />
      </div>
      <h2 className="mt-5 font-display text-2xl">Building your roadmap</h2>
      <p className="mt-1 text-sm text-muted">We're reading official licensing sources for you. This takes about a minute.</p>
      <p key={tip} className="fade-up mx-auto mt-6 max-w-md rounded-xl bg-paper px-4 py-3 text-sm text-ink">
        <span className="font-medium text-brand">Did you know? </span>{TIPS[tip]}
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
