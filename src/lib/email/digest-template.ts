import type { UpcomingRow } from '@/lib/case-events/upcoming'

function dayLabel(dateStr: string, todayStr: string, tomorrowStr: string): string {
  if (dateStr === todayStr) return 'Today'
  if (dateStr === tomorrowStr) return 'Tomorrow'
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long' })
}

function rowHtml(r: UpcomingRow): string {
  return `
    <tr>
      <td style="padding:6px 12px 6px 0;font-variant-numeric:tabular-nums;color:#0f1732;">${r.time || 'All day'}</td>
      <td style="padding:6px 12px;color:#0f1732;">
        <strong>${r.title}</strong><br/>
        <span style="color:#6b7280;font-size:12px;">${r.kind}${r.court ? ` · ${r.court}` : ''} · <span style="font-family:monospace;">${r.fileRef}</span></span>
      </td>
    </tr>`
}

export function buildDigestHtml(recipientName: string, rows: UpcomingRow[]): string {
  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)
  const tomorrowStr = new Date(now.getTime() + 86400000).toISOString().slice(0, 10)

  const groups = new Map<string, UpcomingRow[]>()
  for (const r of rows) {
    const arr = groups.get(r.date) ?? []
    arr.push(r)
    groups.set(r.date, arr)
  }

  const sections = Array.from(groups.entries())
    .map(
      ([date, items]) => `
      <h3 style="font-family:Georgia,serif;font-weight:400;color:#0f1732;margin:20px 0 6px;">${dayLabel(date, todayStr, tomorrowStr)}</h3>
      <table style="width:100%;border-collapse:collapse;font-family:sans-serif;font-size:14px;">
        ${items.map(rowHtml).join('')}
      </table>`
    )
    .join('')

  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
      <p style="color:#0f1732;font-size:15px;">Good morning, ${recipientName || 'there'} —</p>
      ${sections}
      <p style="margin-top:24px;font-size:12px;color:#9ca3af;">T. Jayaraj &amp; Company — Diary</p>
    </div>`
}

export function digestSubject(rows: UpcomingRow[]): string {
  return `Your hearings — today & tomorrow (${rows.length})`
}
