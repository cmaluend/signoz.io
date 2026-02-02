import ComparisonsClient from './ComparisonsClient'
import { fetchMDXContentByPath, MDXContent } from '@/utils/strapi'
import readingTime from 'reading-time'

export const revalidate = 86400
export const dynamicParams = true

export default async function ComparisonsHome() {
  const isProduction = process.env.VERCEL_ENV === 'production'
  const deployment_status = isProduction ? 'live' : 'staging'

  let comparisons: MDXContent[] = []
  try {
    const response = await fetchMDXContentByPath('comparisons', undefined, deployment_status, true)
    comparisons = (response.data || []) as MDXContent[]
  } catch (error) {
    console.error('Error fetching comparisons:', error)
  }

  const formattedComparisons = comparisons
    .map((post) => ({
      ...post,
      title: post.title,
      summary: post.description || post.excerpt,
      date: post.date || post.updatedAt || post.publishedAt,
      tags: post.tags?.map((t: any) => t.value) || [],
      path: `comparisons${post.path}`,
      slug: post.slug || `comparisons${post.path}`,
      authors:
        post.authors?.map((author: any) => ({
          name: author.name,
          image: author.image_url,
        })) || [],
      readingTime: readingTime(post.content || ''),
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return <ComparisonsClient comparisons={formattedComparisons} />
}
