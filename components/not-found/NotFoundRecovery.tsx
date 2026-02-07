'use client'

import { useMemo } from 'react'
import { usePathname } from 'next/navigation'

export type DocsIndexEntry = {
  title: string
  slug: string
}

type SuggestedDoc = {
  title: string
  href: string
}

type NotFoundRecoveryProps = {
  docsIndex: DocsIndexEntry[]
}

const FALLBACK_SLUGS = [
  'introduction',
  'logs-management/send-logs-to-signoz',
  'traces-management/guides/overview',
  'infrastructure-monitoring/overview',
  'aws-monitoring/overview',
  'llm-observability',
]

const STOP_WORDS = new Set([
  'docs',
  'doc',
  'guide',
  'guides',
  'the',
  'and',
  'for',
  'with',
  'to',
  'from',
  'how',
  'what',
  'where',
  'why',
  'page',
  'api',
])

const splitToTokens = (value: string): string[] => {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token))
}

const getNormalizedDocsPath = (pathname: string): string => {
  const withoutQuery = pathname.split('?')[0] ?? pathname
  const withoutHash = withoutQuery.split('#')[0] ?? withoutQuery
  const trimmed = withoutHash.replace(/^\/+/, '')

  if (trimmed.startsWith('docs/')) {
    return trimmed.slice('docs/'.length)
  }

  if (trimmed === 'docs') {
    return ''
  }

  return trimmed
}

const scoreCandidate = (
  doc: DocsIndexEntry,
  pathTokens: string[],
  pathSegments: string[]
): number => {
  if (pathTokens.length === 0) {
    return 0
  }

  const slug = doc.slug.toLowerCase()
  const title = doc.title.toLowerCase()
  const slugSegments = slug.split('/').filter(Boolean)
  const candidateTokens = splitToTokens(`${slug} ${title}`)
  const candidateSet = new Set(candidateTokens)

  let score = 0

  for (const token of pathTokens) {
    if (candidateSet.has(token)) {
      score += 7
      continue
    }

    if (slug.includes(token)) {
      score += 4
      continue
    }

    if (title.includes(token)) {
      score += 3
      continue
    }

    if (
      candidateTokens.some(
        (candidateToken) => candidateToken.startsWith(token) || token.startsWith(candidateToken)
      )
    ) {
      score += 2
    }
  }

  for (const segment of pathSegments) {
    if (segment && slug.includes(segment)) {
      score += 4
    }
  }

  const [firstPathSegment] = pathSegments
  if (firstPathSegment) {
    const firstSegmentMatch = slugSegments.some((segment) => segment.startsWith(firstPathSegment))
    if (firstSegmentMatch) {
      score += 3
    }
  }

  const intersectionCount = pathTokens.filter((token) => candidateSet.has(token)).length
  const unionCount = new Set([...pathTokens, ...candidateTokens]).size
  if (unionCount > 0) {
    score += (intersectionCount / unionCount) * 8
  }

  const unrelatedTokens = candidateTokens.filter(
    (candidateToken) =>
      !pathTokens.some(
        (pathToken) => candidateToken.includes(pathToken) || pathToken.includes(candidateToken)
      )
  )
  score -= Math.min(3, unrelatedTokens.length * 0.6)

  return score
}

const toSuggestedDoc = (doc: DocsIndexEntry): SuggestedDoc => {
  return {
    title: doc.title,
    href: `/docs/${doc.slug}`,
  }
}

const dedupeByHref = (docs: SuggestedDoc[]): SuggestedDoc[] => {
  const seen = new Set<string>()

  return docs.filter((doc) => {
    if (seen.has(doc.href)) {
      return false
    }

    seen.add(doc.href)
    return true
  })
}

export default function NotFoundRecovery({ docsIndex }: NotFoundRecoveryProps) {
  const pathname = usePathname() || '/docs'

  const suggestions = useMemo(() => {
    const normalizedPath = getNormalizedDocsPath(pathname)
    const pathSegments = normalizedPath.split('/').filter(Boolean)
    const pathTokens = splitToTokens(pathSegments.join(' '))

    const scored = docsIndex
      .map((doc) => ({ doc, score: scoreCandidate(doc, pathTokens, pathSegments) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((entry) => toSuggestedDoc(entry.doc))

    const docsBySlug = new Map(docsIndex.map((doc) => [doc.slug, doc] as const))
    const fallback = FALLBACK_SLUGS.map((slug) => docsBySlug.get(slug))
      .filter(Boolean)
      .map((doc) => toSuggestedDoc(doc as DocsIndexEntry))

    const combined = dedupeByHref([...scored, ...fallback]).slice(0, 3)
    if (combined.length > 0) {
      return combined
    }

    return fallback.slice(0, 3)
  }, [docsIndex, pathname])

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
          <code className="rounded bg-signoz_ink-300 px-1.5 py-0.5">{pathname}</code>. You might be
          looking for:
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
