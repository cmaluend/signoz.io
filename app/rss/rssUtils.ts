import { sortPosts } from 'pliny/utils/contentlayer.js'
import { allBlogs, allDocs, allGuides } from 'contentlayer/generated'
import { fetchMDXContentByPath, MDXContentApiResponse } from '../../utils/strapi'
import { normaliseSlug } from '../../scripts/rssFeed.mjs'

const buildFaqSlug = (path = '') => {
  const cleanedPath = path.startsWith('/') ? path : `/${path}`
  return normaliseSlug(`faqs${cleanedPath}`)
}

const getDeploymentStatus = () => (process.env.VERCEL_ENV === 'production' ? 'live' : 'staging')

const mapFaqEntries = (faqs: MDXContentApiResponse | undefined) => {
  if (!faqs?.data?.length) {
    return []
  }

  return faqs.data.map((faq) => ({
    ...faq,
    slug: buildFaqSlug(faq.path),
    date: faq.date ?? faq.publishedAt ?? faq.updatedAt ?? faq.createdAt,
    tags: faq.tags?.map((tag) => tag?.value),
    authors: faq?.authors?.map((author) => author?.key),
  }))
}

const buildOpentelemetrySlug = (path = '') => {
  const cleanedPath = path.startsWith('/') ? path : `/${path}`
  return normaliseSlug(`opentelemetry${cleanedPath}`)
}

const mapOpentelemetryEntries = (opentelemetries: MDXContentApiResponse | undefined) => {
  return opentelemetries?.data.map((opentelemetry) => ({
    ...opentelemetry,
    slug: buildOpentelemetrySlug(opentelemetry.path),
    date:
      opentelemetry.date ??
      opentelemetry.publishedAt ??
      opentelemetry.updatedAt ??
      opentelemetry.createdAt,
  }))
}

const buildComparisonSlug = (slug = '') => {
  const cleanedPath = slug.startsWith('/') ? slug : `/${slug}`
  return normaliseSlug(`comparisons${cleanedPath}`)
}

const mapComparisonEntries = (comparisons: MDXContentApiResponse | undefined) => {
  return comparisons?.data.map((comparison) => ({
    ...comparison,
    slug: buildComparisonSlug(comparison.path),
    date: comparison.date ?? comparison.publishedAt ?? comparison.updatedAt ?? comparison.createdAt,
    tags: comparison.tags?.map((tag) => tag?.value),
    authors: comparison?.authors?.map((author) => author?.key),
  }))
}

export const loadPublishedPosts = async () => {
  const deploymentStatus = getDeploymentStatus()
  const allFaqs = (await fetchMDXContentByPath('faqs', undefined, deploymentStatus, true)) as
    | MDXContentApiResponse
    | undefined

  const faqPosts = mapFaqEntries(allFaqs)

  const allOpentelemetries = (await fetchMDXContentByPath(
    'opentelemetries',
    undefined,
    deploymentStatus,
    true
  )) as MDXContentApiResponse | undefined

  const opentelemetryPosts = mapOpentelemetryEntries(allOpentelemetries)

  const allComparisonsResponse = (await fetchMDXContentByPath(
    'comparisons',
    undefined,
    deploymentStatus,
    true
  )) as MDXContentApiResponse | undefined

  const comparisonPosts = mapComparisonEntries(allComparisonsResponse)

  const combinedPosts = [
    ...faqPosts,
    ...allBlogs,
    ...(opentelemetryPosts || []),
    ...(comparisonPosts || []),
    ...allDocs,
    ...allGuides,
  ]

  return sortPosts(combinedPosts.filter((post: any) => post?.draft !== true) as any[])
}
