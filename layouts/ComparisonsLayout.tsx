'use client'

import { ReactNode } from 'react'
import { CoreContent } from 'pliny/utils/contentlayer'
import type { Authors } from 'contentlayer/generated'
import { MDXContent } from '@/utils/strapi'
import ArticleLayout, { TocItemProps } from './ArticleLayout'
import PageFeedback from '@/components/PageFeedback/PageFeedback'
import { RegionProvider } from '@/components/Region/RegionContext'

// Extend the MDXContent type to include CTA fields
interface ComparisonContent extends MDXContent {
  cta_title?: string
  cta_text?: string
  readingTime?: { text: string; minutes: number; time: number; words: number }
  tags?: any
  date: string
  lastmod?: string
  relatedArticles?: Array<{ title: string; url: string; publishedOn: string }>
}

interface LayoutProps {
  content: CoreContent<ComparisonContent>
  authorDetails: CoreContent<Authors>[]
  authors: string[]
  children: ReactNode
  toc: TocItemProps[]
}

export default function ComparisonsLayout({
  content,
  authorDetails,
  authors,
  children,
  toc,
}: LayoutProps) {
  return (
    <RegionProvider>
      <ArticleLayout
        content={content}
        authorDetails={authorDetails}
        authors={authors}
        toc={toc}
        contentType="comparison"
        showNewsletter={true}
        showRelatedArticles={true}
      >
        {children}
        <PageFeedback />
      </ArticleLayout>
    </RegionProvider>
  )
}
