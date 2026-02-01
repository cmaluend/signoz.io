import OpenTelemetryClient from './OpenTelemetryClient'
import { Metadata } from 'next'
import { fetchMDXContentByPath, MDXContent } from '@/utils/strapi'
import readingTime from 'reading-time'

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
  let comparisons: MDXContent[] = []
  let guides: MDXContent[] = []

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

    comparisons = (response.data || []) as MDXContent[]
  } catch (error) {
    console.error('Error fetching comparisons:', error)
  }

  const formattedComparisons = comparisons.map((post) => ({
    ...post,
    title: post.title,
    summary: post.description || post.excerpt,
    date: post.date || post.updatedAt || post.publishedAt,
    tags: post.tags?.data?.map((t: any) => t.attributes?.name || t.value) || [],
    path: post.path,
    slug: post.slug || post.path,
    authors:
      post.authors?.data?.map((author: any) => ({
        name: author.attributes?.name,
        image: author.attributes?.image_url,
      })) ||
      post.authors ||
      [],
    readingTime: readingTime(post.content || ''),
  }))

  try {
    const response = await fetchMDXContentByPath('guides', undefined, deployment_status, true)

    guides = (response.data || []) as any[]
  } catch (error) {
    console.error('Error fetching guides:', error)
  }

  const formattedGuides = guides.map((post) => ({
    ...post,
    title: post.title,
    summary: post.description || post.excerpt,
    date: post.date || post.updatedAt || post.publishedAt,
    tags: post.tags?.data?.map((t: any) => t.attributes?.name || t.value) || [],
    path: post.path,
    slug: post.slug || post.path,
    authors:
      post.authors?.data?.map((author: any) => ({
        name: author.attributes?.name,
        image: author.attributes?.image_url,
      })) ||
      post.authors ||
      [],
    readingTime: readingTime(post.content || ''),
  }))

  return (
    <OpenTelemetryClient
      initialArticles={articles}
      comparisons={formattedComparisons}
      guides={formattedGuides}
    />
  )
}
