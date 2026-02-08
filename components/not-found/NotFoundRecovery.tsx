import type { SuggestedDoc } from './suggestions'

type NotFoundRecoveryProps = {
  pathname: string
  suggestions: SuggestedDoc[]
  suggestionIntro: string
}

export default function NotFoundRecovery({
  pathname,
  suggestions,
  suggestionIntro,
}: NotFoundRecoveryProps) {
  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-signoz_ink-500 px-4 sm:px-6">
      <div className="bg-dot-pattern masked-dots pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute left-0 right-0 top-0 mx-auto h-[450px] w-full flex-shrink-0 rounded-[956px] bg-gradient-to-b from-[rgba(190,107,241,1)] to-[rgba(69,104,220,0)] bg-[length:110%] bg-no-repeat opacity-30 blur-[300px] sm:bg-[center_-500px] md:h-[956px]" />
      <section
        className="relative z-[1] mx-auto -mt-8 w-full max-w-2xl text-center sm:-mt-10"
        aria-labelledby="not-found-title"
      >
        <p className="text-5xl font-semibold leading-[48px] text-signoz_robin-500">404</p>
        <h1
          id="not-found-title"
          className="mt-4 text-2xl font-medium leading-8 text-signoz_vanilla-100"
        >
          Page Not Found
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-signoz_vanilla-300">
          We could not find{' '}
          <code className="rounded bg-signoz_ink-300 px-1.5 py-0.5">{pathname}</code>.{' '}
          {suggestionIntro}
        </p>

        <ul className="mt-8 space-y-3">
          {suggestions.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="text-base leading-6 text-signoz_robin-400 transition-colors hover:text-signoz_robin-300"
              >
                {item.title}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
