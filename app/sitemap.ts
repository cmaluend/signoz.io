import { MetadataRoute } from 'next'
import { allBlogs, allDocs, allGuides } from 'contentlayer/generated'
import siteMetadata from '@/data/siteMetadata'
import { fetchMDXContentByPath, MDXContentApiResponse } from '@/utils/strapi'

const mapChangeFrequency = (
  frequency: string
): 'weekly' | 'always' | 'hourly' | 'daily' | 'monthly' | 'yearly' | 'never' => {
  switch (frequency) {
    case 'weekly':
    case 'always':
    case 'hourly':
    case 'daily':
    case 'monthly':
    case 'yearly':
    case 'never':
      return frequency
    default:
      return 'weekly'
  }
}

export const dynamic = 'force-dynamic'
export const revalidate = 60

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = siteMetadata.siteUrl

  const blogRoutes = allBlogs
    .filter((post) => !post.draft)
    .map((post) => ({
      url: `${siteUrl}/${post.path}/`,
      lastModified: post.lastmod || post.date,
      changeFrequency: mapChangeFrequency('weekly'),
      priority: 0.5,
    }))

  const docRoutes = allDocs
    .filter((post) => !post.draft)
    .map((post) => ({
      url: `${siteUrl}/${post.path}/`,
      lastModified: post.lastmod || post.date,
      changeFrequency: mapChangeFrequency('weekly'),
      priority: 0.5,
    }))

  // New section for guides
  const guideRoutes = allGuides
    .filter((guide) => !guide.draft)
    .map((guide) => ({
      url: `${siteUrl}/${guide.path}/`,
      lastModified: guide.lastmod || guide.date,
      changeFrequency: mapChangeFrequency('weekly'),
      priority: 0.7,
    }))

  const isProduction = process.env.VERCEL_ENV === 'production'
  const deploymentStatus = isProduction ? 'live' : 'staging'

  const [faqsResult, caseStudiesResult, opentelemetryResult, comparisonsResult] =
    await Promise.allSettled([
      fetchMDXContentByPath('faqs', undefined, deploymentStatus, true),
      fetchMDXContentByPath('case-studies', undefined, deploymentStatus, true),
      fetchMDXContentByPath('opentelemetries', undefined, deploymentStatus, true),
      fetchMDXContentByPath('comparisons', undefined, deploymentStatus, true),
    ])

  let faqRoutes: MetadataRoute.Sitemap = []
  if (faqsResult.status === 'fulfilled') {
    const data = faqsResult.value as MDXContentApiResponse
    faqRoutes = data.data.map((faq) => ({
      url: `${siteUrl}/faqs${faq.path}/`,
      lastModified: faq.date || faq.updatedAt || faq.publishedAt,
    }))
  } else {
    console.error('Error fetching FAQs for sitemap:', faqsResult.reason)
  }

  let caseStudyRoutes: MetadataRoute.Sitemap = []
  if (caseStudiesResult.status === 'fulfilled') {
    const data = caseStudiesResult.value as MDXContentApiResponse
    caseStudyRoutes = data.data.map((caseStudy) => ({
      url: `${siteUrl}/case-study${caseStudy.path}/`,
      changeFrequency: mapChangeFrequency('weekly'),
      priority: 0.5,
      lastModified: caseStudy.updatedAt || caseStudy.publishedAt,
    }))
  } else {
    console.error('Error fetching case studies for sitemap:', caseStudiesResult.reason)
  }

  let opentelemetryRoutes: MetadataRoute.Sitemap = []
  if (opentelemetryResult.status === 'fulfilled') {
    const data = opentelemetryResult.value as MDXContentApiResponse
    opentelemetryRoutes = data.data.map((opentelemetry) => ({
      url: `${siteUrl}/opentelemetry${opentelemetry.path}/`,
      lastModified: opentelemetry.date || opentelemetry.updatedAt || opentelemetry.publishedAt,
      changeFrequency: mapChangeFrequency('weekly'),
      priority: 0.5,
    }))
  } else {
    console.error('Error fetching opentelemetry routes for sitemap:', opentelemetryResult.reason)
  }

  let comparisonRoutes: MetadataRoute.Sitemap = []
  if (comparisonsResult.status === 'fulfilled') {
    const data = comparisonsResult.value as MDXContentApiResponse
    comparisonRoutes = data.data.map((comparison) => ({
      url: `${siteUrl}/comparisons${comparison.path}/`,
      lastModified: comparison.date || comparison.updatedAt || comparison.publishedAt,
      changeFrequency: mapChangeFrequency('weekly'),
      priority: 0.5,
    }))
  } else {
    console.error('Error fetching comparisons for sitemap:', comparisonsResult.reason)
  }

  const routes = [
    '',
    'blog',
    'tags',
    'pricing',
    'case-study',
    'about-us',
    'terms-of-service',
    'privacy',
    'security',
    'support',
    'teams',
    'guides', // Add the main guides page
    'faqs', // Add the main FAQs page
    'opentelemetry',
    'comparisons',
  ].map((route) => ({
    url: `${siteUrl}/${route}${route ? '/' : ''}`,
    lastModified: new Date().toISOString().split('T')[0],
    changeFrequency: mapChangeFrequency('weekly'),
  }))

  return [
    ...routes,
    ...blogRoutes,
    ...opentelemetryRoutes,
    ...docRoutes,
    ...guideRoutes,
    ...faqRoutes,
    ...caseStudyRoutes,
    ...comparisonRoutes,
  ]
}
