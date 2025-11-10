import { NextResponse } from 'next/server'
import { sortPosts } from 'pliny/utils/contentlayer.js'
import siteMetadata from '@/data/siteMetadata.js'
import { generateRss } from '@/lib/rssFeed'
import { allBlogs, allDocs, allOpentelemetries } from 'contentlayer/generated'
import { fetchMDXContentByPath, MDXContentApiResponse } from '@/utils/strapi'

export const runtime = 'nodejs'
export const revalidate = 60

const CACHE_CONTROL_HEADER = 's-maxage=60, stale-while-revalidate=30'

export async function GET() {
  const isProduction = process.env.VERCEL_ENV === 'production'
  const deploymentStatus = isProduction ? 'live' : 'staging'

  const allFaqs = (await fetchMDXContentByPath(
    'faqs',
    undefined,
    deploymentStatus,
    true
  )) as MDXContentApiResponse

  const allPosts = [
    ...allFaqs.data?.map((faq) => ({
      ...faq,
      slug: `faqs${faq.path}`,
    })),
    ...allBlogs,
    ...allOpentelemetries,
    ...allDocs,
  ]

  const publishedPosts = sortPosts((allPosts as any[]).filter((post) => post.draft !== true))
  const rssXml = generateRss(siteMetadata, publishedPosts)

  const response = new NextResponse(rssXml, {
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      'Cache-Control': CACHE_CONTROL_HEADER,
    },
  })

  return response
}
