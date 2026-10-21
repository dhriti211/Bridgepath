// Calls to the Bridgepath backend.

// POST the licensing intake form and call onEvent for every server-sent event.
export function streamRoadmap(formData, onEvent, signal) {
  return stream('/api/roadmap', { method: 'POST', body: formData, signal }, onEvent)
}

// POST a student's profile and chosen goal, streaming events the same way.
export function streamStudentRoadmap(payload, onEvent, signal) {
  return stream('/api/student/roadmap', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal,
  }, onEvent)
}

// POST the student form (and CV) and get back a profile and 3 suggested goals.
export async function suggestGoals(formData, signal) {
  const res = await fetch('/api/student/goals', { method: 'POST', body: formData, signal })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail ? JSON.stringify(body.detail) : `Request failed (${res.status})`)
  }
  return res.json()
}

async function stream(url, init, onEvent) {
  const res = await fetch(url, init)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail ? JSON.stringify(body.detail) : `Request failed (${res.status})`)
  }
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const parts = buffer.split('\n\n')
    buffer = parts.pop()
    for (const part of parts) {
      const line = part.split('\n').find((l) => l.startsWith('data: '))
      if (line) onEvent(JSON.parse(line.slice(6)))
    }
  }
}

export async function askQuestion(payload) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Chat failed (${res.status})`)
  return res.json()
}
