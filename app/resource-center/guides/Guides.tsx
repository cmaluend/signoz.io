import { fetchMDXContentByPath, MDXContentApiResponse } from '@/utils/strapi'
import GuidesClient from './GuidesClient'
import readingTime from 'reading-time'

export default async function Guides() {
  try {
    // Fetch all guides from Strapi
    const isProduction = process.env.VERCEL_ENV === 'production'
    const deployment_status = isProduction ? 'live' : 'staging'

    const response = (await fetchMDXContentByPath(
      'guides',
      undefined,
      deployment_status,
      true
    )) as MDXContentApiResponse

    if (!response || !response.data) {
      console.error('Invalid response from Strapi for guides')
      return <GuidesClient guides={[]} />
    }

    // Transform the data to match the expected format
    const guides = response.data.map((guide) => {
      const readingTimeData = readingTime(guide.content || '')

      return {
        title: guide.title,
        description: guide.description,
        summary: guide.summary,
        date: guide.date,
        lastmod: guide.lastmod,
        tags: guide.tags?.map((tag) => tag.value) || [],
        draft: guide.deployment_status === 'draft',
        slug: guide.path?.replace(/^\//, '') || '', // Remove leading slash for slug
        path: guide.path,
        image: guide.image,
        images: guide.images || [],
        authors: guide.authors?.map((author) => author?.key) || [],
        readingTime: readingTimeData,
        type: 'Guide',
      }
    })

    // Sort by date (descending)
    const sortedGuides = guides.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    // Filter out drafts
    const publishedGuides = sortedGuides.filter((g) => !g.draft)

    return <GuidesClient guides={publishedGuides} />
  } catch (error) {
    console.error('Error fetching guides:', error)
    return <GuidesClient guides={[]} />
  }
}
