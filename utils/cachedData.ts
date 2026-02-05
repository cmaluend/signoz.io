import { unstable_cache } from 'next/cache'
import { fetchMDXContentByPath } from './strapi'
import { transformComparison } from './mdxUtils'

async function fetchComparisons(deploymentStatus: string) {
  try {
    const comparisons = await fetchMDXContentByPath(
      'comparisons',
      undefined,
      deploymentStatus,
      true,
      ['title', 'path', 'date', 'description', 'updatedAt', 'publishedAt']
    )

    if ('data' in comparisons && Array.isArray(comparisons.data)) {
      return comparisons.data.map((comparison) => transformComparison(comparison))
    }
    return []
  } catch (error) {
    console.error('Error fetching cached comparisons:', error)
    return []
  }
}

export function getCachedComparisons(deploymentStatus: string) {
  const cachedFn = unstable_cache(
    async () => {
      console.log('Cache MISS - comparisons - status', deploymentStatus)
      return fetchComparisons(deploymentStatus)
    },
    ['cached-comparisons-list', deploymentStatus],
    {
      tags: ['mdx-content-list', 'comparisons-list'],
      revalidate: 3600,
    }
  )

  return cachedFn()
}
