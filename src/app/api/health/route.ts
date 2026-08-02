import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Keep-alive + liveness probe. UptimeRobot hits this every 5 minutes; the
// select forces Postgres to do work, which resets Supabase's 7-day free-tier
// inactivity timer so the project never auto-pauses during the trial. RLS may
// return zero rows for the anon key — irrelevant, the query still runs on the DB.
export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const started = Date.now()
  // ping() runs on Postgres but touches no table, so it works under the
  // fail-closed RLS grants where a plain table select would be denied.
  const { error } = await supabase.rpc('ping')

  return NextResponse.json(
    {
      ok: !error,
      db: error ? 'down' : 'up',
      ms: Date.now() - started,
      at: new Date().toISOString(),
    },
    { status: error ? 503 : 200 },
  )
}
