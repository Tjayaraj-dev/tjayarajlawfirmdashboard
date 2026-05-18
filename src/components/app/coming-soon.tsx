type ComingSoonProps = {
  module: string
  phase?: string
  description?: string
}

export function ComingSoon({
  module,
  phase = 'Phase B',
  description,
}: ComingSoonProps) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl flex-col justify-center px-6 py-16 lg:px-10">
      <p className="text-[10px] uppercase tracking-[0.4em] text-brand-gold">
        {phase}
      </p>
      <h1 className="mt-3 font-display text-5xl font-light leading-tight tracking-tight text-brand-navy lg:text-6xl">
        {module}
      </h1>
      <div className="mt-6 h-px w-12 bg-brand-navy/15" />
      <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
        {description ??
          `The ${module.toLowerCase()} module will be built next. The schema and security model are designed; the UI lands after the firm's onboarding answers return.`}
      </p>
    </div>
  )
}
