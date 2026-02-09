import { sortPosts } from 'pliny/utils/contentlayer.js'
import { allBlogs, allDocs } from 'contentlayer/generated'
import { fetchMDXContentByPath, MDXContentApiResponse } from '../../utils/strapi'
import { normaliseSlug } from '../../scripts/rssFeed.mjs'
import { transformComparison } from '@/utils/mdxUtils'

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

export const loadPublishedPosts = async () => {
  const deploymentStatus = getDeploymentStatus()
  const [faqsResult, opentelemetriesResult, comparisonsResult] = await Promise.allSettled([
    fetchMDXContentByPath('faqs', undefined, deploymentStatus, true),
    fetchMDXContentByPath('opentelemetries', undefined, deploymentStatus, true),
    fetchMDXContentByPath('comparisons', undefined, deploymentStatus, true),
  ])

  const allFaqs =
    faqsResult.status === 'fulfilled'
      ? (faqsResult.value as MDXContentApiResponse | undefined)
      : undefined

  const allOpentelemetries =
    opentelemetriesResult.status === 'fulfilled'
      ? (opentelemetriesResult.value as MDXContentApiResponse | undefined)
      : undefined

  const allComparisons =
    comparisonsResult.status === 'fulfilled'
      ? (comparisonsResult.value as MDXContentApiResponse | undefined)
      : undefined

  if (faqsResult.status === 'rejected') {
    console.error('Error fetching FAQs for RSS:', faqsResult.reason)
  }

  if (opentelemetriesResult.status === 'rejected') {
    console.error('Error fetching opentelemetries for RSS:', opentelemetriesResult.reason)
  }

  if (comparisonsResult.status === 'rejected') {
    console.error('Error fetching comparisons for RSS:', comparisonsResult.reason)
  }

  const updatedComparisons = allComparisons?.data.map((comparison) =>
    transformComparison(comparison)
  )

  const faqPosts = mapFaqEntries(allFaqs)
  const opentelemetryPosts = mapOpentelemetryEntries(allOpentelemetries)

  const combinedPosts = [
    ...faqPosts,
    ...allBlogs,
    ...(opentelemetryPosts || []),
    ...allDocs,
    ...(updatedComparisons || []),
  ]

  return sortPosts(combinedPosts.filter((post: any) => post?.draft !== true) as any[])
}
