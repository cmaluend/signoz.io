'use client'

import React, { useState } from 'react'
import Blogs from '../blog/Blogs'
import Comparisons from '../comparisons/Comparisons'
import Guides from './Guides'
import OpenTelemetry from '../opentelemetry/OpenTelemetry'
import { MDXContent } from '@/utils/strapi'

export default function GuidesClient({
  comparisons,
  guides,
}: {
  comparisons: MDXContent[]
  guides: MDXContent[]
}) {
  const [activeTab, setActiveTab] = useState('guides-tab')

  return (
    <div className="container mx-auto !mt-[48px] py-16 sm:py-8">
      <div className="tab-content pt-6">
        {activeTab === 'blog-tab' && <Blogs />}

        {activeTab === 'comparisons-tab' && <Comparisons posts={comparisons} />}

        {activeTab === 'guides-tab' && <Guides posts={guides} />}

        {activeTab === 'openTelemetry-tab' && <OpenTelemetry />}
      </div>
    </div>
  )
}
