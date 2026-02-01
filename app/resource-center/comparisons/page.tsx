'use client'

import React, { useState, useEffect } from 'react'
import Blogs from '../blog/Blogs'
import Comparisons from './Comparisons'
import Guides from '../guides/Guides'
import OpenTelemetry from '../opentelemetry/OpenTelemetry'
import { fetchMDXContentByPath, MDXContent } from '@/utils/strapi'
import readingTime from 'reading-time'

export default async function ComparisonsHome() {
  const [activeTab, setActiveTab] = useState('comparisons-tab')
  let comparisons: MDXContent[] = []
  const isProduction = process.env.VERCEL_ENV === 'production'
  const deployment_status = isProduction ? 'live' : 'staging'

  try {
    const response = await fetchMDXContentByPath('comparisons', undefined, deployment_status, true)
    comparisons = (response.data || []) as MDXContent[]
  } catch (error) {
    console.error('Error fetching comparisons:', error)
  }

  // Transform comparisons to match BlogPostCard structure if needed
  const formattedComparisons = comparisons.map((post) => ({
    ...post,
    title: post.title,
    summary: post.description || post.excerpt,
    date: post.data || post.updatedAt || post.publishedAt,
    tags: post.tags?.map((t: any) => t.value) || [],
    path: `comparisons${post.path}`,
    slug: post.slug || `comparisons${post.path}`,
    authors:
      post.authors?.map((author: any) => ({
        name: author.name,
        image: author.image_url,
      })) || [],
    readingTime: readingTime(post.content || ''),
  }))

  return (
    <div className="container mx-auto !mt-[48px] py-16 sm:py-8">
      <div className="tab-content pt-6">
        {activeTab === 'blog-tab' && <Blogs />}

        {activeTab === 'comparisons-tab' && <Comparisons posts={formattedComparisons} />}

        {activeTab === 'guides-tab' && <Guides />}

        {activeTab === 'openTelemetry-tab' && <OpenTelemetry />}
      </div>
    </div>
  )
}
