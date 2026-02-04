import { unstable_cache } from 'next/cache'
import { fetchMDXContentByPath } from './strapi'
import { transformComparison } from './mdxUtils'

export const getCachedComparisons = unstable_cache(
  async (deploymentStatus: string) => {
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
  },
  ['cached-comparisons-list'],
  {
    tags: ['mdx-content-list', 'comparisons-list'],
    revalidate: 3600,
  }
)
