import { useState } from 'react'
import { ENGLISH_TESTS, EXAMPLES, PROFESSIONS, STATES } from '../data'

const EMPTY = {
  profession: 'nurse', country: '', degree: '', years_experience: 0,
  target_state: 'Arizona', english_test_type: '', english_test_score: '', notes: '',
}

const input =
  'w-full rounded-lg border border-line bg-white px-3 py-2.5 text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20'

export default function IntakeForm({ onSubmit, initial }) {
  const [form, setForm] = useState(initial ?? EMPTY)
  const [cv, setCv] = useState(null)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  function submit(e) {
    e.preventDefault()
    const data = new FormData()
    const { english_test_type: type, english_test_score: score, ...rest } = form
    Object.entries(rest).forEach(([k, v]) => data.append(k, v))
    data.append('english_test', type ? `${type}${score ? ` score ${score}` : ' (score not given)'}` : 'none taken yet')
    if (cv) data.append('cv', cv)
    onSubmit(data, form)
  }

  return (
    <form onSubmit={submit} className="rounded-3xl border border-line bg-card p-6 shadow-xl shadow-ink/5 sm:p-8">
      <div className="mb-6">
        <p className="mb-2 text-sm font-medium text-muted">Try an example</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button key={ex.label} type="button" onClick={() => setForm(ex.form)}
              className="rounded-full border border-line bg-paper px-3 py-1.5 text-sm text-ink transition hover:border-brand hover:text-brand">
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your profession">
          <select className={input} value={form.profession} onChange={set('profession')}>
            {PROFESSIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </Field>
        <Field label="Where you want to work">
          <select className={input} value={form.target_state} onChange={set('target_state')}>
            {STATES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Country of your degree">
          <input required className={input} value={form.country} onChange={set('country')} placeholder="e.g. Nigeria" />
        </Field>
        <Field label="Degree">
          <input required className={input} value={form.degree} onChange={set('degree')} placeholder="e.g. BSc Nursing" />
        </Field>
        <Field label="Years of work experience">
          <input type="number" min="0" max="60" className={input} value={form.years_experience} onChange={set('years_experience')} />
        </Field>
        <Field label="English test (if any)">
          <div className="flex gap-2">
            <select className={input} value={form.english_test_type} onChange={set('english_test_type')}>
              <option value="">None yet</option>
              {ENGLISH_TESTS.map((t) => <option key={t}>{t}</option>)}
            </select>
            {form.english_test_type && (
              <input className={`${input} w-28`} inputMode="decimal" value={form.english_test_score}
                onChange={set('english_test_score')} placeholder="Score" aria-label="Overall score" />
            )}
          </div>
        </Field>
      </div>

      <Field label="Anything else? (current job, visa, specialties)" className="mt-4">
        <textarea rows={3} className={input} value={form.notes} onChange={set('notes')} />
      </Field>

      <Field label="Upload your CV or transcript (optional, PDF or text)" className="mt-4">
        <input type="file" accept=".pdf,.txt,.md" onChange={(e) => setCv(e.target.files[0] || null)}
          className="block w-full text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-brand-soft file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-dark" />
      </Field>

      <button type="submit"
        className="mt-6 w-full rounded-xl bg-brand px-6 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-brand-dark">
        Build my roadmap
      </button>
      <p className="mt-3 text-center text-xs text-muted">
        Takes about a minute. We search official licensing sources live.
      </p>
    </form>
  )
}

function Field({ label, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      {children}
    </label>
  )
}
