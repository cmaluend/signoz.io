import 'css/prism.css'
import 'katex/dist/katex.css'

import { components } from '@/components/MDXComponents'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { coreContent } from 'pliny/utils/contentlayer'
import { allAuthors } from 'contentlayer/generated'
import type { Authors } from 'contentlayer/generated'
import OpenTelemetryLayout from '@/layouts/OpenTelemetryLayout'
import OpenTelemetryHubLayout from '@/layouts/OpenTelemetryHubLayout'
import BlogLayout from '@/layouts/BlogLayout'
import { getHubContextForRoute } from '@/utils/opentelemetryHub'
import { Metadata } from 'next'
import siteMetadata from '@/data/siteMetadata'
import { notFound } from 'next/navigation'
import PageFeedback from '../../../components/PageFeedback/PageFeedback'
import React from 'react'
import { fetchMDXContentByPath, fetchAllMDXPaths } from '@/utils/strapi'
import { generateTOC, generateStructuredData } from '@/utils/content'

// Remark packages
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import {
  remarkExtractFrontmatter,
  remarkCodeTitles,
  remarkImgToJsx,
} from 'pliny/mdx-plugins/index.js'
// Rehype packages
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypePrismPlus from 'rehype-prism-plus'
import rehypePresetMinify from 'rehype-preset-minify'
import { fromHtmlIsomorphic } from 'hast-util-from-html-isomorphic'

// heroicon mini link
const icon = fromHtmlIsomorphic(
  `
  <span class="content-header-link">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 linkicon">
  <path d="M12.232 4.232a2.5 2.5 0 0 1 3.536 3.536l-1.225 1.224a.75.75 0 0 0 1.061 1.06l1.224-1.224a4 4 0 0 0-5.656-5.656l-3 3a4 4 0 0 0 .225 5.865.75.75 0 0 0 .977-1.138 2.5 2.5 0 0 1-.142-3.667l3-3Z" />
  <path d="M11.603 7.963a.75.75 0 0 0-.977 1.138 2.5 2.5 0 0 1 .142 3.667l-3 3a2.5 2.5 0 0 1-3.536-3.536l1.225-1.224a.75.75 0 0 0-1.061-1.06l-1.224 1.224a4 4 0 1 0 5.656 5.656l3-3a4 4 0 0 0-.225-5.865Z" />
  </svg>
  </span>
`,
  { fragment: true }
)

const defaultLayout = 'BlogLayout'
const layouts = {
  OpenTelemetryLayout,
  BlogLayout,
}

export const dynamicParams = false
export const dynamic = 'force-static'

export async function generateMetadata({
  params,
}: {
  params: { slug: string[] }
}): Promise<Metadata | undefined> {
  const slug = decodeURI(params.slug.join('/'))

  let post
  try {
    const response = await fetchMDXContentByPath('comparisons', slug)
    post = 'data' in response ? response.data : response
  } catch (e) {
    return notFound()
  }

  if (!post) {
    return notFound()
  }

  const authorList = post?.authors || ['default']
  const authorDetails = authorList.map((author: any) => {
    // Check if author is string (slug) or object
    const authorSlug = typeof author === 'string' ? author : author.slug || author.name
    const authorResults = allAuthors.find((p) => p.slug === authorSlug || p.name === authorSlug)
    return authorResults
      ? coreContent(authorResults as Authors)
      : { name: 'SigNoz Team', avatar: '/img/SigNoz.png' }
  })

  const publishedAt = new Date(post.publishedAt || post.date).toISOString()
  const modifiedAt = new Date(post.updatedAt || post.lastmod || post.date).toISOString()
  const authors = authorDetails.map((author: any) => author.name)
  let imageList = [siteMetadata.socialBanner]
  if (post.image) {
    imageList = typeof post.image === 'string' ? [post.image] : post.image
  }
  const ogImages = imageList.map((img: string) => {
    return {
      url: img.includes('http') ? img : siteMetadata.siteUrl + img,
    }
  })

  return {
    title: post.title,
    description: post?.description || post?.excerpt,
    openGraph: {
      title: post.title,
      description: post?.description || post?.excerpt,
      siteName: siteMetadata.title,
      locale: 'en_US',
      type: 'article',
      publishedTime: publishedAt,
      modifiedTime: modifiedAt,
      url: './',
      images: ogImages,
      authors: authors.length > 0 ? authors : [siteMetadata.author],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post?.description || post?.excerpt,
      images: imageList,
    },
  }
}

export const generateStaticParams = async () => {
  const paths = await fetchAllMDXPaths('comparisons')
  return paths.map((p) => {
    // p is like "/comparisons/slug" or "slug"
    // we need to return { slug: ['slug'] } or { slug: ['subdir', 'slug'] }
    const slug = p.replace(/^\/comparisons\//, '').replace(/^\//, '')
    return { slug: slug.split('/') }
  })
}

export default async function Page({ params }: { params: { slug: string[] } }) {
  const slug = decodeURI(params.slug.join('/'))
  const currentRoute = `/comparisons/${slug}`

  let post
  try {
    const response = await fetchMDXContentByPath('comparisons', slug)
    post = 'data' in response ? response.data : response
  } catch (e) {
    return notFound()
  }

  if (!post) {
    return notFound()
  }

  const authorList = post?.authors || ['default']
  const authorDetails = authorList.map((author: any) => {
    // Check if author is string (slug) or object
    const authorSlug = typeof author === 'string' ? author : author.slug || author.name
    const authorResults = allAuthors.find((p) => p.slug === authorSlug || p.name === authorSlug)
    return authorResults
      ? coreContent(authorResults as Authors)
      : { name: 'SigNoz Team', avatar: '/img/SigNoz.png' }
  })

  // Create a compatible post object for Layout
  const postForLayout = {
    ...post,
    date: post.publishedAt || post.date,
    lastmod: post.updatedAt || post.lastmod,
    slug: slug, // explicit slug
    toc: generateTOC(post.content),
  }

  // Generate structured data
  const jsonLd = generateStructuredData(postForLayout, `comparisons/${slug}`)

  const hubContext = getHubContextForRoute(currentRoute)

  // MDX Options
  const mdxOptions = {
    mdxOptions: {
      remarkPlugins: [
        remarkExtractFrontmatter,
        remarkGfm,
        remarkCodeTitles,
        remarkMath,
        remarkImgToJsx,
      ],
      rehypePlugins: [
        rehypeSlug,
        [
          rehypeAutolinkHeadings,
          {
            behavior: 'prepend',
            headingProperties: {
              className: ['content-header'],
            },
            content: icon,
          },
        ],
        [rehypePrismPlus, { defaultLanguage: 'js', ignoreMissing: true }],
        rehypePresetMinify,
      ],
    },
  }

  if (hubContext) {
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <OpenTelemetryHubLayout
          content={postForLayout as any}
          authorDetails={authorDetails as any}
          authors={authorList}
          toc={postForLayout.toc}
          navItems={hubContext.items}
          currentHubPath={hubContext.pathKey}
          pathMeta={hubContext.firstRouteByPath}
          defaultLanguage={hubContext.defaultLanguage}
          availableLanguages={hubContext.languages}
          currentRoute={currentRoute}
        >
          <MDXRemote source={post.content} components={components} options={mdxOptions as any} />
          <PageFeedback />
        </OpenTelemetryHubLayout>
      </>
    )
  }

  // Choose layout based on slug or post layout
  let layoutName = post.layout || defaultLayout
  if (slug.includes('opentelemetry')) {
    layoutName = 'OpenTelemetryLayout'
  } else {
    layoutName = 'BlogLayout'
  }

  // @ts-ignore
  const Layout = layouts[layoutName]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Layout
        content={postForLayout as any}
        authorDetails={authorDetails as any}
        authors={authorList}
        toc={postForLayout.toc}
      >
        <MDXRemote source={post.content} components={components} options={mdxOptions as any} />
        <PageFeedback />
      </Layout>
    </>
  )
}
