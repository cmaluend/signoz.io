import { fetchMDXContentByPath, MDXContentApiResponse } from '@/utils/strapi'
import ComparisonsClient from './ComparisonsClient'
import readingTime from 'reading-time'

export default async function ComparisonsListing() {
  try {
    // Fetch all comparisons from Strapi
    const isProduction = process.env.VERCEL_ENV === 'production'
    const deployment_status = isProduction ? 'live' : 'staging'

    const response = (await fetchMDXContentByPath(
      'comparisons',
      undefined,
      deployment_status,
      true
    )) as MDXContentApiResponse

    if (!response || !response.data) {
      console.error('Invalid response from Strapi for comparisons')
      return <ComparisonsClient comparisons={[]} />
    }

    // Transform the data to match the expected format
    const comparisons = response.data.map((comparison) => {
      const readingTimeData = readingTime(comparison.content || '')

      return {
        title: comparison.title,
        description: comparison.description,
        summary: comparison.summary,
        date: comparison.date,
        lastmod: comparison.lastmod,
        tags: comparison.tags?.map((tag) => tag.value) || [],
        draft: comparison.deployment_status === 'draft',
        slug: comparison.path?.replace(/^\//, '') || '', // Remove leading slash for slug
        path: comparison.path,
        image: comparison.image,
        images: comparison.images || [],
        authors: comparison.authors?.map((author) => author?.key) || [],
        readingTime: readingTimeData,
        type: 'Comparison',
      }
    })

    // Sort by date (descending)
    const sortedComparisons = comparisons.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    // Filter out drafts
    const publishedComparisons = sortedComparisons.filter((c) => !c.draft)

    return <ComparisonsClient comparisons={publishedComparisons} />
  } catch (error) {
    console.error('Error fetching comparisons:', error)
    return <ComparisonsClient comparisons={[]} />
  }
}
