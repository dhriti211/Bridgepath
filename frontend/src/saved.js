// Roadmaps saved in this browser (no account needed). Nothing leaves the device.

const KEY = 'bridgepath-saved'
const MAX = 10

export function loadSaved() {
  try { return JSON.parse(localStorage.getItem(KEY)) || [] } catch { return [] }
}

function write(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list)) } catch { /* storage full or blocked */ }
  return list
}

export function saveRoadmap({ mode, profile, roadmap }) {
  const title = mode === 'student'
    ? `${profile?.degree_level ?? ''} ${profile?.major ?? ''} → ${profile?.target_role ?? ''}`.trim()
    : `${profile?.profession ?? 'Professional'} → ${profile?.target_state ?? ''}`
  const entry = { id: String(Date.now()), savedAt: new Date().toISOString(), title, mode, profile, roadmap }
  const rest = loadSaved().filter((s) => s.roadmap.headline !== roadmap.headline)
  return write([entry, ...rest].slice(0, MAX))
}

export function deleteSaved(id) {
  return write(loadSaved().filter((s) => s.id !== id))
}
