'use client'

import { ReactNode } from 'react'
import { CoreContent } from 'pliny/utils/contentlayer'
import type { Authors } from 'contentlayer/generated'
import ArticleLayout, { TocItemProps } from './ArticleLayout'
import PageFeedback from '@/components/PageFeedback/PageFeedback'
import type { MDXContent } from '@/utils/strapi'

interface LayoutProps {
  content: CoreContent<MDXContent>
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
  )
}
