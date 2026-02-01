'use client'

import React, { useState } from 'react'
import Blogs from '../blog/Blogs'
import Comparisons from './Comparisons'
import Guides from '../guides/Guides'
import OpenTelemetry from '../opentelemetry/OpenTelemetry'
import { MDXContent } from '@/utils/strapi'

export default function ComparisonsClient({ comparisons }: { comparisons: MDXContent[] }) {
  const [activeTab, setActiveTab] = useState('comparisons-tab')

  return (
    <div className="container mx-auto !mt-[48px] py-16 sm:py-8">
      <div className="tab-content pt-6">
        {activeTab === 'blog-tab' && <Blogs />}

        {activeTab === 'comparisons-tab' && <Comparisons posts={comparisons} />}

        {activeTab === 'guides-tab' && <Guides />}

        {activeTab === 'openTelemetry-tab' && <OpenTelemetry />}
      </div>
    </div>
  )
}
