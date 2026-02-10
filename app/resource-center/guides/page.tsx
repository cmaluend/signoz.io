import React from 'react'
import Guides from './Guides'
import { fetchMDXContentByPath, MDXContent } from '@/utils/strapi'
import { transformGuide } from '@/utils/mdxUtils'

export default async function GuidesHome() {
  const isProduction = process.env.VERCEL_ENV === 'production'
  const deploymentStatus = isProduction ? 'live' : 'staging'
  let guides: MDXContent[] = []

  try {
    const guidesResponse = await fetchMDXContentByPath('guides', undefined, deploymentStatus, true)
    guides = guidesResponse.data.map((guide) => transformGuide(guide))
  } catch (error) {
    console.error('Error fetching guides:', error)
    guides = []
  }

  return (
    <div className="container mx-auto !mt-[48px] py-16 sm:py-8">
      <div className="tab-content pt-6">
        <Guides guides={guides} />
      </div>
    </div>
  )
}
