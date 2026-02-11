import { ALGOLIA_CANDIDATE_LIMIT, QUICK_LINK_FALLBACK } from './constants'
import { rerankSuggestions, tokenizePathForSuggestions } from './rerank'
import type { AlgoliaHit, SuggestedDoc } from './types'

export const hasAlgoliaConfig = (): boolean => {
  return Boolean(
    process.env.NEXT_PUBLIC_ALGOLIA_APP_ID &&
      process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY &&
      process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME
  )
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
    const parsed = new URL(url, 'https://signoz.io')
    if (!parsed.pathname.startsWith('/docs/')) {
      return null
    }
    return `${parsed.pathname}${parsed.hash}`
  } catch {
    return null
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

export const getNotFoundSuggestions = async (
  pathname: string,
  count = 3
): Promise<SuggestedDoc[]> => {
  if (!hasAlgoliaConfig()) {
    return QUICK_LINK_FALLBACK.slice(0, count)
  }

  const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID as string
  const apiKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY as string
  const indexName = process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME as string

  const tokens = tokenizePathForSuggestions(pathname)
  const query = tokens.join(' ').trim()

  if (!query) {
    return QUICK_LINK_FALLBACK.slice(0, count)
  }

  try {
    const response = await fetch(
      `https://${appId}-dsn.algolia.net/1/indexes/${encodeURIComponent(indexName)}/query`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Algolia-API-Key': apiKey,
          'X-Algolia-Application-Id': appId,
        },
        body: JSON.stringify({
          query,
          hitsPerPage: ALGOLIA_CANDIDATE_LIMIT,
        }),
        // Suggestions should be fresh for typo/moved-path recovery
        cache: 'no-store',
      }
    )

    if (!response.ok) {
      return QUICK_LINK_FALLBACK.slice(0, count)
    }

    const data = (await response.json()) as { hits?: AlgoliaHit[] }
    const hits = data.hits || []

    const fromAlgolia = hits
      .map((hit) => {
        if (!hit.url) return null
        const href = toDocsHref(hit.url)
        const title = getTitleFromHit(hit)
        if (!href || !title) return null
        return { href, title } as SuggestedDoc
      })
      .filter(Boolean) as SuggestedDoc[]

    const reranked = rerankSuggestions(dedupeByHref(fromAlgolia), tokens)
    return dedupeByHref([...reranked, ...QUICK_LINK_FALLBACK]).slice(0, count)
  } catch {
    return QUICK_LINK_FALLBACK.slice(0, count)
  }
}
