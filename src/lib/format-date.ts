// Deterministic date formatting for SSR. Locale-based toLocaleString() differs
// between the Node server and the browser (locale + timezone data), which causes
// React hydration mismatches. We pin the timezone to Asia/Kuala_Lumpur and
// assemble from numeric parts so server and client always produce identical text.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function partsKL(iso: string): Record<string, string> {
  const f = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kuala_Lumpur',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  return Object.fromEntries(f.formatToParts(new Date(iso)).map((p) => [p.type, p.value]))
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const p = partsKL(iso)
  return `${p.day} ${MONTHS[Number(p.month) - 1]} ${p.year}`
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const p = partsKL(iso)
  return `${p.day} ${MONTHS[Number(p.month) - 1]} ${p.year}, ${p.hour}:${p.minute}`
}
