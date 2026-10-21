import { useState } from 'react'
import { askQuestion } from '../api'
import { hostOf } from '../util'

const SUGGESTIONS = {
  license: ['What if I move to Texas instead?', 'Which step should I start this week?', 'Can I work while I study for the exam?'],
  student: ['What happens if I lose my job on OPT?', 'Which companies near me sponsor H-1B?', 'Can I travel abroad while my OPT is pending?'],
}

export default function Chat({ profile, roadmap }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)

  async function send(question) {
    if (!question.trim() || busy) return
    const history = messages.map(({ role, content }) => ({ role, content }))
    setMessages((m) => [...m, { role: 'user', content: question }])
    setText('')
    setBusy(true)
    try {
      const res = await askQuestion({ question, profile, roadmap, history })
      setMessages((m) => [...m, { role: 'assistant', content: res.answer, sources: res.sources }])
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', content: `Sorry, something went wrong: ${e.message}` }])
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="no-print flex flex-col rounded-2xl border border-line bg-card shadow-sm">
      <div className="border-b border-line p-4">
        <h3 className="font-semibold">Ask about your roadmap</h3>
        <p className="text-sm text-muted">Answers use your plan and fresh searches when needed.</p>
      </div>
      <div className="max-h-96 flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS[roadmap.mode === 'student' ? 'student' : 'license'].map((s) => (
              <button key={s} onClick={() => send(s)} className="rounded-full border border-line px-3 py-1.5 text-left text-sm hover:border-brand hover:text-brand">
                {s}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'flex justify-end' : ''}>
            <div className={`max-w-[90%] whitespace-pre-wrap rounded-xl px-3.5 py-2.5 text-sm ${m.role === 'user' ? 'bg-brand text-white' : 'bg-paper text-ink'}`}>
              {m.content}
              {m.sources?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  {m.sources.map((s) => (
                    <a key={s.url} href={s.url} target="_blank" rel="noreferrer" className="text-brand hover:underline">{hostOf(s.url)}</a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {busy && <div className="text-sm text-muted">Thinking…</div>}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(text) }} className="flex gap-2 border-t border-line p-3">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a question"
          className="flex-1 rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand" />
        <button disabled={busy} className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-50">Ask</button>
      </form>
    </div>
  )
}
