// Builds an .ics calendar file of the roadmap's key dates, entirely in the browser.

const ymd = (iso) => iso.replaceAll('-', '')
const nextDay = (iso) => {
  const d = new Date(iso + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}
// RFC 5545 text escaping
const esc = (s) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')

function event(uid, date, summary, description) {
  return [
    'BEGIN:VEVENT',
    `UID:${uid}@bridgepath`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
    `DTSTART;VALUE=DATE:${ymd(date)}`,
    `DTEND;VALUE=DATE:${ymd(nextDay(date))}`,
    `SUMMARY:${esc(summary)}`,
    `DESCRIPTION:${esc(description)}`,
    'END:VEVENT',
  ].join('\r\n')
}

export function buildIcs(deadlines) {
  const events = []
  deadlines.forEach((d, i) => {
    const note = d.detail + (d.approximate ? ' (Usual dates; check USCIS for this year.)' : '') +
      '\nFrom your Bridgepath roadmap. Confirm with your DSO.'
    if (d.start && d.end) {
      events.push(event(`${i}-start`, d.start, `Opens: ${d.label}`, note))
      events.push(event(`${i}-end`, d.end, `Last day: ${d.label}`, note))
    } else if (d.start || d.end) {
      events.push(event(`${i}`, d.end || d.start, d.label, note))
    }
  })
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Bridgepath//Key dates//EN', 'CALSCALE:GREGORIAN',
    ...events, 'END:VCALENDAR'].join('\r\n') + '\r\n'
}

export function downloadIcs(deadlines) {
  const blob = new Blob([buildIcs(deadlines)], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'bridgepath-key-dates.ics'
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
