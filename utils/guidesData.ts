import { unstable_cache } from 'next/cache'
import { fetchMDXContentByPath, MDXContent } from './strapi'
import { transformGuide } from './mdxUtils'

async function fetchGuides(deploymentStatus: string) {
  try {
    const guides = await fetchMDXContentByPath('guides', undefined, deploymentStatus, true)

    if ('data' in guides && Array.isArray(guides.data)) {
      const transformed = guides.data
        .map((guide: MDXContent) => {
          try {
            return transformGuide(guide)
          } catch (transformError) {
            console.error('[guidesData] Error transforming guide:', {
              guideId: guide.id,
              guideTitle: guide.title,
              error: transformError,
            })
            return null
          }
        })
        .filter((g): g is NonNullable<typeof g> => g !== null)

      return transformed
    }

    console.warn('[guidesData] No guides data found or invalid response structure')
    return []
  } catch (error) {
    console.error('[guidesData] Error fetching cached guides:', error)
    return []
  }
}

export function getCachedGuides(deploymentStatus: string) {
  const cachedFn = unstable_cache(
    async () => {
      console.log('Cache MISS - guides - status', deploymentStatus)
      return fetchGuides(deploymentStatus)
    },
    ['cached-guides-list', deploymentStatus],
    {
      tags: ['mdx-content-list', 'guides-list'],
      revalidate: 3600,
    }
  )

  return cachedFn()
}
