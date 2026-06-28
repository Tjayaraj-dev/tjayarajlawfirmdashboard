import { MfaChallenge } from '@/components/app/mfa-challenge'

export const metadata = { title: 'Verify · T. Jayaraj & Company' }

export default function MfaPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-navy px-6">
      <MfaChallenge />
    </main>
  )
}
