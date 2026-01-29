import OpenTelemetryClient from './OpenTelemetryClient'
import { Metadata } from 'next'
import { fetchMDXContentByPath } from '@/utils/strapi'

export const revalidate = 3600
export const dynamicParams = true

export const metadata: Metadata = {
  title: 'OpenTelemetry Learning Track | SigNoz',
  description:
    'Learn about OpenTelemetry - the open-source observability framework for cloud-native software. Guides, blogs, and resources to help you implement OpenTelemetry.',
  alternates: {
    canonical: 'https://signoz.io/resource-center/opentelemetry',
  },
  openGraph: {
    title: 'OpenTelemetry Learning Track | SigNoz',
    description:
      'Learn about OpenTelemetry - the open-source observability framework for cloud-native software. Guides, blogs, and resources to help you implement OpenTelemetry.',
    url: './resource-center/opentelemetry',
    siteName: 'SigNoz',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    title: 'OpenTelemetry Learning Track | SigNoz',
    card: 'summary_large_image',
    description:
      'Learn about OpenTelemetry - the open-source observability framework for cloud-native software. Guides, blogs, and resources to help you implement OpenTelemetry.',
  },
}

export default async function OpenTelemetryHome() {
  const isProduction = process.env.VERCEL_ENV === 'production'
  const deployment_status = isProduction ? 'live' : 'staging'
  let articles: any[] = []
  let comparisons: any[] = []

  try {
    const response = await fetchMDXContentByPath(
      'opentelemetries',
      undefined,
      deployment_status,
      true
    )

    articles = (response.data || []) as any[]
  } catch (error) {
    console.error('Error fetching OpenTelemetry articles:', error)
  }

  try {
    const response = await fetchMDXContentByPath('comparisons', undefined, deployment_status, true)

    comparisons = (response.data || []) as any[]
  } catch (error) {
    console.error('Error fetching comparisons:', error)
  }

  // Transform comparisons to match BlogPostCard structure if needed
  const formattedComparisons = comparisons.map((post) => ({
    title: post.title,
    summary: post.excerpt || post.description,
    date: post.publishedAt,
    tags: post.tags?.map((t: any) => t.value) || [],
    path: post.path || `comparisons/${post.slug}`,
    slug: post.slug,
    authors:
      post.authors?.map((author: any) => ({
        name: author.name,
        image: author.image_url,
      })) || [],
    readingTime: { text: post.readingTime?.text || '5 min read' },
  }))

  return <OpenTelemetryClient initialArticles={articles} comparisons={formattedComparisons} />
}
