import ListLayout from '@/layouts/ListLayoutWithTags'
import { getCachedGuides } from '@/utils/guidesData'

const POSTS_PER_PAGE = 5

export const generateStaticParams = async () => {
  const isProduction = process.env.VERCEL_ENV === 'production'
  const deploymentStatus = isProduction ? 'live' : 'staging'
  const guides = await getCachedGuides(deploymentStatus)
  const totalPages = Math.ceil(guides.length / POSTS_PER_PAGE)
  const paths = Array.from({ length: totalPages }, (_, i) => ({ page: (i + 1).toString() }))

  return paths
}

export default async function Page({ params }: { params: { page: string } }) {
  const isProduction = process.env.VERCEL_ENV === 'production'
  const deploymentStatus = isProduction ? 'live' : 'staging'
  const guides = await getCachedGuides(deploymentStatus)

  const posts = guides.sort((a: any, b: any) => {
    const aDate = new Date(a.date || a.publishedAt || a.updatedAt || 0).getTime()
    const bDate = new Date(b.date || b.publishedAt || b.updatedAt || 0).getTime()
    return bDate - aDate
  })

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
      posts={posts as any}
      initialDisplayPosts={initialDisplayPosts as any}
      pagination={pagination}
      title="All Posts"
    />
  )
}
