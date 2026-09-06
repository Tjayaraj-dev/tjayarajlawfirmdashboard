import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUpcoming } from '@/lib/case-events/upcoming'
import { buildDigestHtml, digestSubject } from '@/lib/email/digest-template'

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const auth = request.headers.get('authorization') ?? ''
  const expected = `Bearer ${secret}`
  const a = Buffer.from(auth)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

// Daily digest: one email per profile listing their hearings today/tomorrow.
// Admins get every matter firm-wide; staff get only matters assigned to them
// (case_events has no assigned_to of its own — getUpcoming filters it via the
// joined matter). Recipients with nothing in the window are skipped.
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const resend = new Resend(process.env.RESEND_API_KEY)

  const { data: profiles } = await supabase.from('profiles').select('id, role, full_name, email')

  let sent = 0
  let skipped = 0

  for (const p of profiles ?? []) {
    const rows = await getUpcoming(supabase, {
      horizonDays: 1,
      assignedTo: p.role === 'admin' ? undefined : p.id,
    })
    if (rows.length === 0) {
      skipped++
      continue
    }

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: p.email,
      subject: digestSubject(rows),
      html: buildDigestHtml(p.full_name, rows),
    })
    sent++
  }

  return NextResponse.json({ ok: true, sent, skipped, total: profiles?.length ?? 0 })
}
