import React from 'react'
import Comparisons from './Comparisons'
import { transformComparison } from '@/utils/mdxUtils'
import { fetchMDXContentByPath, MDXContent } from '@/utils/strapi'

export default async function ComparisonsHome() {
  const isProduction = process.env.VERCEL_ENV === 'production'
  const deploymentStatus = isProduction ? 'live' : 'staging'
  let comparisons: MDXContent[] = []

  try {
    const comparisonsResponse = await fetchMDXContentByPath(
      'comparisons',
      undefined,
      deploymentStatus,
      true
    )
    comparisons = comparisonsResponse.data.map((comparison) => transformComparison(comparison))
  } catch (error) {
    console.error('Error fetching comparisons:', error)
    comparisons = []
  }

  return (
    <div className="container mx-auto !mt-[48px] py-16 sm:py-8">
      <div className="tab-content pt-6">
        <Comparisons comparisons={comparisons} />
      </div>
    </div>
  )
}
