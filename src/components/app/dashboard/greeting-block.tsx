type GreetingBlockProps = {
  firstName: string
  insight: string
}

export function GreetingBlock({ firstName, insight }: GreetingBlockProps) {
  const now = new Date()
  const hour = now.getHours()
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const dateLabel = now.toLocaleDateString('en-MY', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <section
      className="space-y-3"
      style={{ animation: 'fade-up 600ms ease-out both' }}
    >
      <p className="text-[10px] uppercase tracking-[0.4em] text-brand-gold">
        {dateLabel} · {greeting}
      </p>
      <h1 className="font-display text-4xl font-light leading-[1.05] tracking-tight text-brand-navy lg:text-5xl">
        Welcome, <span className="italic">{firstName}.</span>
      </h1>
      <p className="max-w-xl text-[15px] leading-relaxed text-muted-foreground">
        {insight}
      </p>
    </section>
  )
}
