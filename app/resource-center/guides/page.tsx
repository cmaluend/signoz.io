import React from 'react'
import Guides from './Guides'
import { getCachedGuides } from '@/utils/guidesData'
import { MDXContent } from '@/utils/strapi'

export default async function GuidesHome() {
  const isProduction = process.env.VERCEL_ENV === 'production'
  const deploymentStatus = isProduction ? 'live' : 'staging'
  let guides: MDXContent[] = []

  try {
    guides = await getCachedGuides(deploymentStatus)
  } catch (error) {
    console.error('[GuidesHome] Error fetching guides:', error)
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
