import ListLayout from '@/layouts/ListLayoutWithTags'
import { fetchMDXContentByPath, MDXContentApiResponse } from '@/utils/strapi'
import { genPageMetadata } from 'app/seo'

const POSTS_PER_PAGE = 5

export const metadata = genPageMetadata({ title: 'Comparisons' })

export default async function ComparisonsPage() {
  const isProduction = process.env.VERCEL_ENV === 'production'
  const deploymentStatus = isProduction ? 'live' : 'staging'

  let posts: any[] = []
  try {
    const response = (await fetchMDXContentByPath(
      'comparisons',
      undefined,
      deploymentStatus,
      true
    )) as MDXContentApiResponse

    if (response && response.data) {
      posts = response.data.map((post) => ({
        title: post.title,
        summary: post.excerpt || post.description,
        date: post.publishedAt,
        tags: post.tags?.map((t: any) => t.value) || [],
        path: post.path || `comparisons/${post.slug}`,
        slug: post.slug,
      }))
    }
  } catch (error) {
    console.error('Error fetching comparisons:', error)
  }

  // Sort posts by date
  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const pageNumber = 1
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
      posts={posts}
      initialDisplayPosts={initialDisplayPosts}
      pagination={pagination}
      title="All Comparisons"
    />
  )
}
