import type { Metadata } from 'next'
import Image from 'next/image'
import { ForgotPasswordForm } from '@/components/app/forgot-password-form'

export const metadata: Metadata = {
  title: 'Recover access · T. Jayaraj & Company',
  description: 'Restore access to the firm command centre.',
}

export default function ForgotPasswordPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-brand-navy">
      <Image
        src="/auth-bg.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
        style={{
          filter: 'grayscale(0.15) brightness(0.45) contrast(1.08) saturate(0.85)',
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(to right, rgba(11, 17, 38, 0.92) 0%, rgba(11, 17, 38, 0.6) 38%, rgba(11, 17, 38, 0.35) 62%, rgba(11, 17, 38, 0.78) 100%)',
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 50% 40% at 25% 30%, var(--brand-gold) 0, transparent 60%)',
        }}
      />

      <div className="relative flex min-h-screen flex-col">
        <header
          className="flex items-start justify-between px-6 py-7 sm:px-10 sm:py-9 lg:px-16 lg:py-10"
          style={{ animation: 'fade-up 700ms ease-out both' }}
        >
          <div>
            <p className="font-display text-base font-medium tracking-[0.2em] text-white sm:text-lg">
              T. JAYARAJ
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.4em] text-brand-gold">
              &amp; Company · Advocates
            </p>
          </div>
          <p className="hidden text-right text-[10px] uppercase tracking-[0.4em] text-white/45 lg:block">
            Est. 1987
            <br />
            <span className="text-white/30">Sungai Petani · Kuala Lumpur</span>
          </p>
        </header>

        <div className="flex flex-1 items-center px-6 pb-12 sm:px-10 lg:px-16">
          <div className="grid w-full grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div
              className="max-w-lg"
              style={{ animation: 'fade-up 900ms ease-out 150ms both' }}
            >
              <div className="mb-6 h-px w-12 bg-brand-gold" />
              <h1 className="font-display text-[2.6rem] font-light leading-[1.02] tracking-tight text-white sm:text-5xl lg:text-[3.75rem]">
                Access,
                <br />
                <span className="italic text-white/90">restored.</span>
              </h1>
              <p className="mt-7 max-w-md text-[15px] leading-relaxed text-white/65">
                Enter your firm email and we&rsquo;ll send a secure link to
                restore access to your command centre.
              </p>
            </div>

            <div
              className="flex justify-center lg:justify-end"
              style={{ animation: 'fade-up 1000ms ease-out 300ms both' }}
            >
              <div className="w-full max-w-sm border border-white/10 bg-white/[0.04] p-7 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] backdrop-blur-2xl sm:p-9">
                <div className="mb-7 flex items-center gap-3">
                  <div className="h-px w-6 bg-brand-gold/70" />
                  <p className="text-[10px] uppercase tracking-[0.4em] text-brand-gold/90">
                    Recovery
                  </p>
                </div>
                <ForgotPasswordForm />
              </div>
            </div>
          </div>
        </div>

        <footer
          className="flex flex-col items-center justify-between gap-2 px-6 py-6 text-[10px] uppercase tracking-[0.3em] text-white/35 sm:flex-row sm:px-10 lg:px-16"
          style={{ animation: 'fade-up 1100ms ease-out 500ms both' }}
        >
          <span>Aurexis Solution</span>
          <span className="hidden text-white/25 sm:inline">
            Access by invitation only
          </span>
          <span>{new Date().getFullYear()}</span>
        </footer>
      </div>
    </main>
  )
}
