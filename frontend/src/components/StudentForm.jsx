import { useState } from 'react'
import { DEGREE_LEVELS, STAGES, STATES, STUDENT_EXAMPLES } from '../data'
import { Field, input } from './fields'

const EMPTY = {
  degree_level: "Master's", major: '', school: '', country: '', stem: 'not sure', stage: 'studying',
  program_end: '', opt_end: '', target_role: '', target_state: 'Anywhere in the US', notes: '',
}

export default function StudentForm({ onSubmit, initial, busy }) {
  const [form, setForm] = useState(initial ?? EMPTY)
  const [cv, setCv] = useState(null)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const onOpt = form.stage === 'opt' || form.stage === 'stem_opt'

  function submit(e) {
    e.preventDefault()
    const data = new FormData()
    Object.entries(form).forEach(([k, v]) => data.append(k, k === 'opt_end' && !onOpt ? '' : v))
    if (cv) data.append('cv', cv)
    onSubmit(data)
  }

  return (
    <form onSubmit={submit} className="rounded-3xl border border-line bg-card p-6 shadow-xl shadow-ink/5 sm:p-8">
      <div className="mb-6">
        <p className="mb-2 text-sm font-medium text-muted">Try an example</p>
        <div className="flex flex-wrap gap-2">
          {STUDENT_EXAMPLES.map((ex) => (
            <button key={ex.label} type="button" onClick={() => setForm(ex.form)}
              className="rounded-full border border-line bg-paper px-3 py-1.5 text-sm text-ink transition hover:border-brand hover:text-brand">
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Degree level">
          <select className={input} value={form.degree_level} onChange={set('degree_level')}>
            {DEGREE_LEVELS.map((d) => <option key={d}>{d}</option>)}
          </select>
        </Field>
        <Field label="Major">
          <input required className={input} value={form.major} onChange={set('major')} placeholder="e.g. Computer Science" />
        </Field>
        <Field label="Is your degree STEM?">
          <select className={input} value={form.stem} onChange={set('stem')}>
            <option value="yes">Yes (STEM CIP code on my I-20)</option>
            <option value="no">No</option>
            <option value="not sure">Not sure</option>
          </select>
        </Field>
        <Field label="Where you are now">
          <select className={input} value={form.stage} onChange={set('stage')}>
            {STAGES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </Field>
        <Field label="Program end date (on your I-20)">
          <input type="date" required={form.stage === 'studying'} className={input} value={form.program_end} onChange={set('program_end')} />
        </Field>
        {onOpt ? (
          <Field label="OPT card (EAD) end date">
            <input type="date" className={input} value={form.opt_end} onChange={set('opt_end')} />
          </Field>
        ) : (
          <Field label="Country of citizenship">
            <input className={input} value={form.country} onChange={set('country')} placeholder="e.g. India" />
          </Field>
        )}
        <Field label="Job you want">
          <input required className={input} value={form.target_role} onChange={set('target_role')} placeholder="e.g. Data engineer" />
        </Field>
        <Field label="Where you want to work">
          <select className={input} value={form.target_state} onChange={set('target_state')}>
            <option>Anywhere in the US</option>
            {STATES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
      </div>

      <Field label="Anything else? (internships, CPT, current job, concerns)" className="mt-4">
        <textarea rows={3} className={input} value={form.notes} onChange={set('notes')} />
      </Field>

      <Field label="Upload your resume (optional, PDF or text)" className="mt-4">
        <input type="file" accept=".pdf,.txt,.md" onChange={(e) => setCv(e.target.files[0] || null)}
          className="block w-full text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-brand-soft file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-dark" />
      </Field>

      <button type="submit" disabled={busy}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-70">
        {busy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
        {busy ? 'Reading your background' : 'Suggest my goals'}
      </button>
      <p className="mt-3 text-center text-xs text-muted">
        We suggest 3 goals that fit your background. You pick one, then we build the plan.
      </p>
    </form>
  )
}
