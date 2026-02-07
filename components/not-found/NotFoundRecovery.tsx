'use client'

import { liteClient as algoliasearch } from 'algoliasearch/lite'
import { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'

type SuggestedDoc = {
  title: string
  href: string
}

const QUICK_LINK_FALLBACK: SuggestedDoc[] = [
  {
    title: 'Get Started with SigNoz',
    href: '/docs/introduction',
  },
  {
    title: 'Instrument Your Application with OpenTelemetry',
    href: '/docs/instrumentation',
  },
  {
    title: 'Send Logs to SigNoz',
    href: '/docs/logs-management/send-logs-to-signoz',
  },
]

const FALLBACK_SUGGESTIONS = QUICK_LINK_FALLBACK

const STOP_WORDS = new Set(['docs', 'doc', 'the', 'and', 'for', 'with', 'to', 'from', 'page'])

const tokenizePath = (pathname: string): string[] => {
  return pathname
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((token) => token.replace(/\d+$/g, ''))
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token))
}

type AlgoliaHit = {
  url?: string
  title?: string
  hierarchy?: {
    lvl0?: string | null
    lvl1?: string | null
    lvl2?: string | null
    lvl3?: string | null
  }
}

const getTitleFromHit = (hit: AlgoliaHit): string | null => {
  return (
    hit.title ||
    hit.hierarchy?.lvl3 ||
    hit.hierarchy?.lvl2 ||
    hit.hierarchy?.lvl1 ||
    hit.hierarchy?.lvl0 ||
    null
  )
}

const toDocsHref = (url: string): string | null => {
  try {
    const parsed = new URL(url, window.location.origin)
    if (!parsed.pathname.startsWith('/docs/')) {
      return null
    }
    return `${parsed.pathname}${parsed.hash}`
  } catch {
    return null
  }
}

export default function NotFoundRecovery() {
  const pathname = usePathname() || '/'
  const fallbackSuggestions = useMemo(() => FALLBACK_SUGGESTIONS, [])

  const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID
  const apiKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY
  const indexName = process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME
  const hasAlgoliaConfig = Boolean(appId && apiKey && indexName)
  const [suggestions, setSuggestions] = useState<SuggestedDoc[]>(
    hasAlgoliaConfig ? [] : FALLBACK_SUGGESTIONS
  )
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(hasAlgoliaConfig)
  const suggestionIntro = hasAlgoliaConfig
    ? 'You might be looking for:'
    : 'Popular docs to get started:'

  useEffect(() => {
    if (!hasAlgoliaConfig || !appId || !apiKey || !indexName) {
      setIsLoadingSuggestions(false)
      setSuggestions(fallbackSuggestions)
      return
    }

    const tokens = tokenizePath(pathname)
    const query = tokens.join(' ').trim()
    if (!query) {
      setIsLoadingSuggestions(false)
      setSuggestions(fallbackSuggestions)
      return
    }

    let cancelled = false
    const client = algoliasearch(appId, apiKey)
    setIsLoadingSuggestions(true)
    setSuggestions([])

    const loadSuggestions = async () => {
      try {
        const response = (await client.search([
          {
            indexName,
            params: {
              query,
              hitsPerPage: 10,
            },
          },
        ])) as {
          results?: Array<{ hits?: AlgoliaHit[] }>
        }

        const hits = response.results?.[0]?.hits || []

        const fromAlgolia = hits
          .map((hit) => {
            if (!hit.url) return null
            const href = toDocsHref(hit.url)
            const title = getTitleFromHit(hit)
            if (!href || !title) return null
            return { href, title } as SuggestedDoc
          })
          .filter(Boolean) as SuggestedDoc[]

        const deduped = [...fromAlgolia, ...fallbackSuggestions].filter(
          (doc, index, arr) => arr.findIndex((candidate) => candidate.href === doc.href) === index
        )

        if (!cancelled) {
          setSuggestions(deduped.slice(0, 3))
          setIsLoadingSuggestions(false)
        }
      } catch {
        if (!cancelled) {
          setSuggestions(fallbackSuggestions)
          setIsLoadingSuggestions(false)
        }
      }
    }

    void loadSuggestions()

    return () => {
      cancelled = true
    }
  }, [apiKey, appId, fallbackSuggestions, hasAlgoliaConfig, indexName, pathname])

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
          {isLoadingSuggestions && hasAlgoliaConfig ? (
            <li className="text-base leading-6 text-signoz_vanilla-400">
              Finding relevant docs...
            </li>
          ) : (
            suggestions.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="text-base leading-6 text-signoz_robin-400 transition-colors hover:text-signoz_robin-300"
                >
                  {item.title}
                </a>
              </li>
            ))
          )}
        </ul>
      </section>
    </main>
  )
}
