import ListLayout from '@/layouts/ListLayoutWithTags'
import { fetchMDXContentByPath, MDXContentApiResponse } from '@/utils/strapi'
import { notFound } from 'next/navigation'
import readingTime from 'reading-time'

const POSTS_PER_PAGE = 5

export const revalidate = 0
export const dynamicParams = true

export const generateStaticParams = async () => {
  const isProduction = process.env.VERCEL_ENV === 'production'
  const deploymentStatus = isProduction ? 'live' : 'staging'

  try {
    const response = (await fetchMDXContentByPath(
      'guides',
      undefined,
      deploymentStatus,
      true
    )) as MDXContentApiResponse

    if (!response || !response.data) {
      return []
    }

    const totalPages = Math.ceil(response.data.length / POSTS_PER_PAGE)
    const paths = Array.from({ length: totalPages }, (_, i) => ({ page: (i + 1).toString() }))
    return paths
  } catch (error) {
    console.error('Error generating static params for guides:', error)
    return []
  }
}

export default async function Page({ params }: { params: { page: string } }) {
  const isProduction = process.env.VERCEL_ENV === 'production'
  const deploymentStatus = isProduction ? 'live' : 'staging'

  let allGuidesData: MDXContentApiResponse['data'] = []
  try {
    const response = (await fetchMDXContentByPath(
      'guides',
      undefined,
      deploymentStatus,
      true
    )) as MDXContentApiResponse

    if (!response || !response.data) {
      notFound()
    }
    allGuidesData = response.data
  } catch (error) {
    console.error('Error fetching paginated guides:', error)
    notFound()
  }

  const guides = allGuidesData.map((guide) => ({
    ...guide,
    title: guide.title,
    summary: guide.description || guide.excerpt,
    path: `guides${guide.path}`,
    date: guide.date || guide.updatedAt || guide.publishedAt,
    slug: guide.slug || `guides${guide.path}`,
    readingTime: readingTime(guide.content || ''),
    toc: guide.toc,
    type: 'Guides',
    structuredData: guide.structuredData,
    filePath: `guides${guide.path}`,
  }))

  const sortedGuides = guides.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const pageNumber = parseInt(params.page as string)
  const initialDisplayPosts = sortedGuides.slice(
    POSTS_PER_PAGE * (pageNumber - 1),
    POSTS_PER_PAGE * pageNumber
  )
  const pagination = {
    currentPage: pageNumber,
    totalPages: Math.ceil(sortedGuides.length / POSTS_PER_PAGE),
  }

  return (
    <ListLayout
      posts={sortedGuides}
      initialDisplayPosts={initialDisplayPosts}
      pagination={pagination}
      title="All Guides"
    />
  )
}
