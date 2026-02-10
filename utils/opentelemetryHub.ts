import hubConfig from '@/constants/opentelemetry_hub.json'
import { LEARN_CHAPTER_ORDER } from '@/constants/opentelemetryHub'
import { allBlogs, type Blog } from 'contentlayer/generated'
import { MDXContent } from './strapi'

type RawHubPath = {
  key: string
  label: string
  articles?: RawHubArticle[]
  chapters?: RawHubGroup[]
  sections?: RawHubGroup[]
}

const PATH_ORDER = ['learn', 'quick-start']

type RawHubGroup = {
  key: string
  label: string
  articles?: RawHubArticle[]
  sections?: RawHubGroup[]
}

type RawHubArticle = {
  url: string
  language?: string
}

export type HubNavDoc = {
  type: 'doc'
  route: string
  label: string
  language?: string
}

export type HubNavCategory = {
  type: 'category'
  label: string
  route?: string
  items: HubNavItem[]
  key?: string
}

export type HubNavItem = HubNavDoc | HubNavCategory

export type HubPathNav = {
  key: string
  label: string
  items: HubNavItem[]
  firstRoute?: string
  languages: string[]
}

type HubLookupEntry = {
  pathKey: string
  language?: string
}

type HubIndex = {
  lookup: Map<string, HubLookupEntry>
  paths: HubPathNav[]
}

let memoizedHubIndex: HubIndex | null = null

import { getCachedComparisons } from './cachedData'
import { getCachedGuides } from './guidesData'

const getComparisons = async () => {
  const isProduction = process.env.VERCEL_ENV === 'production'
  const deploymentStatus = isProduction ? 'live' : 'staging'

  try {
    return await getCachedComparisons(deploymentStatus)
  } catch (error) {
    console.error('Error fetching comparisons:', error)
    return []
  }
}

const getGuides = async () => {
  const isProduction = process.env.VERCEL_ENV === 'production'
  const deploymentStatus = isProduction ? 'live' : 'staging'

  try {
    return await getCachedGuides(deploymentStatus)
  } catch (error) {
    console.error('Error fetching guides:', error)
    return []
  }
}

function normalizeRoute(route: string) {
  // Strip domain if present
  const withoutDomain = route.replace(/^https?:\/\/[^/]+/i, '')
  let normalized = withoutDomain.startsWith('/') ? withoutDomain : `/${withoutDomain}`
  // Remove trailing slash (not for root)
  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1)
  }
  return normalized
}

function findContentTitle(route: string, contentIndex: any[]) {
  const normalized = normalizeRoute(route)
  const matchingCollection = contentIndex.find(({ prefix }) => normalized.startsWith(prefix))
  if (!matchingCollection) {
    return null
  }

  const slug = normalized.replace(matchingCollection.prefix, '')
  const entry = matchingCollection.collection.find((doc) => doc.slug === slug)
  return entry?.title || null
}

function fallbackLabelFromRoute(route: string, contentIndex: any[]) {
  const slug = route.split('/').filter(Boolean).pop() || ''
  return (
    findContentTitle(route, contentIndex) ||
    slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  )
}

function articleToDoc(article: RawHubArticle, contentIndex: any[]): HubNavDoc {
  const route = normalizeRoute(article.url)
  const title = findContentTitle(route, contentIndex) || fallbackLabelFromRoute(route, contentIndex)

  return {
    type: 'doc',
    route,
    label: title as string,
    language: article.language,
  }
}

function mapGroupToCategory(group: RawHubGroup, contentIndex: any[]): HubNavCategory {
  const items: HubNavItem[] = []

  if (group.sections) {
    for (const section of group.sections) {
      items.push(mapGroupToCategory(section, contentIndex))
    }
  }

  if (group.articles) {
    for (const article of group.articles) {
      items.push(articleToDoc(article, contentIndex))
    }
  }

  const firstDocRoute = findFirstDocRoute(items)

  return {
    type: 'category',
    label: group.label,
    route: firstDocRoute,
    items,
    key: group.key,
  }
}

function findFirstDocRoute(items: HubNavItem[]): string | undefined {
  for (const item of items) {
    if (item.type === 'doc') {
      return item.route
    }
    if (item.type === 'category') {
      const route = findFirstDocRoute(item.items)
      if (route) return route
    }
  }
  return undefined
}

function collectLanguages(items: HubNavItem[], accumulator: Set<string>) {
  for (const item of items) {
    if (item.type === 'doc' && item.language) {
      accumulator.add(item.language)
    }
    if (item.type === 'category') {
      collectLanguages(item.items, accumulator)
    }
  }
}

async function buildHubIndex({
  comparisons,
  guides,
}: {
  comparisons: MDXContent[]
  guides: MDXContent[]
}): Promise<HubIndex> {
  const lookup = new Map<string, HubLookupEntry>()
  const paths: HubPathNav[] = []

  const contentIndex = [
    {
      prefix: '/blog/',
      collection: allBlogs as Array<Blog>,
    },
    {
      prefix: '/comparisons/',
      collection: comparisons,
    },
    {
      prefix: '/guides/',
      collection: guides,
    },
  ]

  const sortedPaths = ([...hubConfig.paths] as RawHubPath[]).sort(
    (a: RawHubPath, b: RawHubPath) => {
      const aIdx = PATH_ORDER.indexOf(a.key)
      const bIdx = PATH_ORDER.indexOf(b.key)
      return (
        (aIdx === -1 ? Number.MAX_SAFE_INTEGER : aIdx) -
        (bIdx === -1 ? Number.MAX_SAFE_INTEGER : bIdx)
      )
    }
  )

  for (const rawPath of sortedPaths) {
    const items: HubNavItem[] = []
    const chapters =
      rawPath.key === 'learn' && rawPath.chapters
        ? [...rawPath.chapters].sort((a, b) => {
            const aIdx = LEARN_CHAPTER_ORDER.indexOf(a.key)
            const bIdx = LEARN_CHAPTER_ORDER.indexOf(b.key)
            return (
              (aIdx === -1 ? Number.MAX_SAFE_INTEGER : aIdx) -
              (bIdx === -1 ? Number.MAX_SAFE_INTEGER : bIdx)
            )
          })
        : rawPath.chapters

    if (chapters) {
      for (const chapter of chapters) {
        items.push(mapGroupToCategory(chapter, contentIndex))
      }
    }

    if (rawPath.sections) {
      for (const section of rawPath.sections) {
        items.push(mapGroupToCategory(section, contentIndex))
      }
    }

    if (rawPath.articles) {
      for (const article of rawPath.articles) {
        items.push(articleToDoc(article, contentIndex))
      }
    }

    const firstRoute = findFirstDocRoute(items)
    const languageSet = new Set<string>()
    collectLanguages(items, languageSet)
    const languages = Array.from(languageSet)

    // Populate lookup map
    const addToLookup = (entries: HubNavItem[]) => {
      for (const entry of entries) {
        if (entry.type === 'doc') {
          lookup.set(entry.route, { pathKey: rawPath.key, language: entry.language })
        } else {
          addToLookup(entry.items)
        }
      }
    }
    addToLookup(items)

    paths.push({
      key: rawPath.key,
      label: rawPath.label,
      items,
      firstRoute,
      languages,
    })
  }

  return { lookup, paths }
}

async function getHubIndex({
  comparisons,
  guides,
}: {
  comparisons?: MDXContent[]
  guides?: MDXContent[]
}): Promise<HubIndex> {
  if (memoizedHubIndex) {
    return memoizedHubIndex
  }

  let usedComparisons = comparisons
  let usedGuides = guides
  if (!usedComparisons) {
    try {
      usedComparisons = await getComparisons()
    } catch (e) {
      usedComparisons = []
    }
  }

  if (!usedGuides) {
    try {
      usedGuides = await getGuides()
    } catch (e) {
      console.error('[opentelemetryHub] Error fetching guides for hub:', e)
      usedGuides = []
    }
  }

  memoizedHubIndex = await buildHubIndex({
    comparisons: usedComparisons,
    guides: usedGuides,
  })
  return memoizedHubIndex
}

export async function getHubContextForRoute({
  route,
  comparisons,
  guides,
}: {
  route: string
  comparisons?: MDXContent[]
  guides?: MDXContent[]
}) {
  const normalized = normalizeRoute(route)
  const { lookup, paths } = await getHubIndex({ comparisons, guides })

  const match = lookup.get(normalized)
  if (!match) {
    return null
  }

  const pathNav = paths.find((p) => p.key === match.pathKey)
  if (!pathNav) {
    return null
  }

  return {
    pathKey: match.pathKey,
    pathLabel: pathNav.label,
    items: pathNav.items,
    languages: pathNav.languages,
    defaultLanguage: match.language || null,
    firstRouteByPath: paths.map((p) => ({ key: p.key, label: p.label, firstRoute: p.firstRoute })),
  }
}

export function clearHubIndexCache() {
  memoizedHubIndex = null
}
