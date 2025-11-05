import ListLayout from '@/layouts/ListLayoutWithTags'
import { fetchMDXContentByPath, MDXContentApiResponse } from '@/utils/strapi'
import readingTime from 'reading-time'
import { notFound } from 'next/navigation'
import { CoreContent } from 'pliny/utils/contentlayer'

const POSTS_PER_PAGE = 5

export const revalidate = 0
export const dynamicParams = true

export const generateStaticParams = async () => {
  // Return empty array for ISR
  return []
}

export default async function Page({ params }: { params: { page: string } }) {
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
      notFound()
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
        slug: guide.path?.replace(/^\//, '') || '',
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
    const posts = sortedGuides.filter((g) => !g.draft)

    const pageNumber = parseInt(params.page as string)
    const initialDisplayPosts = posts.slice(
      POSTS_PER_PAGE * (pageNumber - 1),
      POSTS_PER_PAGE * pageNumber
    )
    const pagination = {
      currentPage: pageNumber,
      totalPages: Math.ceil(posts.length / POSTS_PER_PAGE),
    }

    return (
      <ListLayout
        posts={posts as CoreContent<any>[]} // TODO: fix types here, adding any for build
        initialDisplayPosts={initialDisplayPosts as CoreContent<any>[]}
        pagination={pagination}
        title="All Posts"
      />
    )
  } catch (error) {
    console.error('Error fetching guides:', error)
    notFound()
  }
}
