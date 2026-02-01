import GuidesClient from './GuidesClient'
import { fetchMDXContentByPath, MDXContent } from '@/utils/strapi'
import readingTime from 'reading-time'

export const revalidate = 3600
export const dynamicParams = true

export default async function GuidesHome() {
  const isProduction = process.env.VERCEL_ENV === 'production'
  const deployment_status = isProduction ? 'live' : 'staging'

  let comparisons: MDXContent[] = []
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
      post.authors?.map((author: any) => ({
        ...author,
        name: author.name,
        image: author.image_url,
      })) ||
      post.authors ||
      [],
    readingTime: readingTime(post.content || ''),
  }))

  let guides: MDXContent[] = []
  try {
    const response = await fetchMDXContentByPath('guides', undefined, deployment_status, true)
    guides = (response.data || []) as MDXContent[]
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

  return <GuidesClient comparisons={formattedComparisons} guides={formattedGuides} />
}
