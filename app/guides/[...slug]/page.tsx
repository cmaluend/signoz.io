import 'css/prism.css'
import { components } from '@/components/MDXComponents'
import { notFound } from 'next/navigation'
import OpenTelemetryLayout from '@/layouts/OpenTelemetryLayout'
import OpenTelemetryHubLayout from '@/layouts/OpenTelemetryHubLayout'
import GuidesLayout from '@/layouts/GuidesLayout'
import { getHubContextForRoute } from '@/utils/opentelemetryHub'
import { Metadata } from 'next'
import siteMetadata from '@/data/siteMetadata'
import { SidebarIcons } from '@/components/sidebar-icons/icons'
import PageFeedback from '../../../components/PageFeedback/PageFeedback'
import React from 'react'
import GrafanaVsSigNozFloatingCard from '@/components/GrafanaVsSigNoz/GrafanaVsSigNozFloatingCard'
import Button from '@/components/ui/Button'
import { fetchMDXContentByPath, MDXContent } from '@/utils/strapi'
import { generateStructuredData } from '@/utils/structuredData'
import { compileMDX } from 'next-mdx-remote/rsc'
import readingTime from 'reading-time'
import Link from 'next/link'
import { generateTOC, mdxOptions } from '@/utils/mdxUtils'
import { CoreContent } from 'pliny/utils/contentlayer'

const defaultLayout = 'GuidesLayout'
const layouts = {
  OpenTelemetryLayout,
  GuidesLayout,
}

export const dynamicParams = true
export const revalidate = 0

export async function generateMetadata({
  params,
}: {
  params: { slug: string[] }
}): Promise<Metadata | undefined> {
  const slug = decodeURI(params.slug.join('/'))

  const isProduction = process.env.VERCEL_ENV === 'production'
  const deploymentStatus = isProduction ? 'live' : 'staging'

  try {
    const response = await fetchMDXContentByPath('guides', slug, deploymentStatus)
    const post = (response?.data as MDXContent) || null

    if (!post) {
      return
    }

    const publishedAt = new Date(post.publishedAt).toISOString()
    const modifiedAt = new Date(post.updatedAt || post.publishedAt).toISOString()
    const authors = post.authors?.map((author: any) => ({ name: author?.name })) || [
      { name: siteMetadata.author },
    ]

    let imageList = [siteMetadata.socialBanner]
    if (post.image) {
      imageList = typeof post.image === 'string' ? [post.image] : post.image
    }

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
        images: imageList,
        authors: authors.map((author) => author.name),
      },
      twitter: {
        card: 'summary_large_image',
        title: post.title,
        description: post.summary || post.description || post.excerpt,
        images: imageList,
      },
    }
  } catch (e) {
    console.error('Error generating metadata for guide:', e)
    return
  }
}

export const generateStaticParams = async () => {
  return []
}

export default async function Page({ params }: { params: { slug: string[] } }) {
  const slug = decodeURI(params.slug.join('/'))
  const currentRoute = `/guides/${slug}`
  const isGrafanaOrPrometheusArticle =
    slug.toLowerCase().includes('grafana') || slug.toLowerCase().includes('prometheus')

  const isProduction = process.env.VERCEL_ENV === 'production'
  const deploymentStatus = isProduction ? 'live' : 'staging'

  let post: MDXContent | null = null
  try {
    const response = await fetchMDXContentByPath('guides', slug, deploymentStatus)
    post = (response?.data as MDXContent) || null
  } catch (error) {
    console.error('Error fetching guide content:', error)
  }

  if (!post) {
    return notFound()
  }

  const readingTimeData = readingTime(post?.content || '')
  const toc = generateTOC(post?.content || '')

  let compiledContent
  try {
    const { content: mdxContent } = await compileMDX({
      source: post?.content || '',
      components,
      options: mdxOptions as any,
    })
    compiledContent = mdxContent
  } catch (error) {
    console.error('Error compiling MDX:', error)
    notFound()
  }

  const structuredData = generateStructuredData('guides', post)

  const mainContent = {
    ...post,
    date: post.publishedAt,
    lastmod: post.updatedAt,
    slug: slug,
    path: post.path || currentRoute,
    tags: post.tags?.map((tag: any) => tag.value) || [],
    readingTime: readingTimeData,
    toc: toc,
    authors: post.authors?.map((author: any) => author?.name) || [],
    structuredData: structuredData,
    relatedArticles:
      post.related_guides?.map((guide: any) => ({
        ...guide,
        url: `/guides${guide.path}`,
        publishedOn: guide.date || guide.updatedAt || guide.publishedAt,
      })) || [],
    cta_title: post.cta_title,
    cta_text: post.cta_text,
  }

  const authorDetails = post.authors?.map((author: any) => ({
    name: author.name || 'Unknown Author',
    avatar: author.image_url || '/static/images/signoz-logo.png',
    occupation: author.title || 'Developer Tools',
    company: 'SigNoz',
    email: 'team@signoz.io',
    twitter: 'https://twitter.com/SigNozHQ',
    linkedin: 'https://www.linkedin.com/company/signoz',
    github: 'https://github.com/SigNoz/signoz',
    path: `/authors/${author.key || 'default'}`,
    type: 'Authors',
  })) || [
    {
      name: 'SigNoz Team',
      avatar: '/static/images/signoz-logo.png',
      occupation: 'Developer Tools',
      company: 'SigNoz',
      email: 'team@signoz.io',
      twitter: 'https://twitter.com/SigNozHQ',
      linkedin: 'https://www.linkedin.com/company/signoz',
      github: 'https://github.com/SigNoz/signoz',
      path: '/authors/default',
      type: 'Authors',
    },
  ]

  const authorNames = authorDetails.map((author: any) => author.name)

  const hubContext = getHubContextForRoute(currentRoute)

  if (hubContext) {
    return (
      <>
        {structuredData && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
          />
        )}

        <div className="container mx-auto">
          <Button variant={'ghost'} isButton={true} className="ml-3.5 mt-10 hover:bg-transparent">
            <Link href={`/resource-center/guides/`} className="flex items-center">
              <SidebarIcons.ArrowLeft />
              <span className="pl-1.5 text-sm">Back to Guides</span>
            </Link>
          </Button>
        </div>

        <OpenTelemetryHubLayout
          content={mainContent as CoreContent<MDXContent>}
          authorDetails={authorDetails}
          authors={authorNames}
          toc={toc}
          navItems={hubContext.items}
          currentHubPath={hubContext.pathKey}
          pathMeta={hubContext.firstRouteByPath}
          defaultLanguage={hubContext.defaultLanguage}
          availableLanguages={hubContext.languages}
          currentRoute={currentRoute}
        >
          <div className="prose prose-slate max-w-none dark:prose-invert">{compiledContent}</div>
          <PageFeedback />
        </OpenTelemetryHubLayout>

        {/* Render GrafanaVsSigNozFloatingCard if the slug contains Grafana or Prometheus */}
        {isGrafanaOrPrometheusArticle && <GrafanaVsSigNozFloatingCard />}
      </>
    )
  }

  // Choose layout based on slug or post layout
  let layoutName = post.layout || defaultLayout
  if (slug.includes('opentelemetry')) {
    layoutName = 'OpenTelemetryLayout'
  } else {
    layoutName = 'GuidesLayout'
  }

  // @ts-ignore
  const Layout = layouts[layoutName]

  return (
    <>
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}

      <div className="container mx-auto">
        <Button variant={'ghost'} isButton={true} className="ml-3.5 mt-10 hover:bg-transparent">
          <Link href={`/resource-center/guides/`} className="flex items-center">
            <SidebarIcons.ArrowLeft />
            <span className="pl-1.5 text-sm">Back to Guides</span>
          </Link>
        </Button>
      </div>

      <Layout content={mainContent} authorDetails={authorDetails} authors={authorNames} toc={toc}>
        <div className="prose prose-slate max-w-none dark:prose-invert">{compiledContent}</div>
      </Layout>

      {/* Render GrafanaVsSigNozFloatingCard if the slug contains Grafana or Prometheus */}
      {isGrafanaOrPrometheusArticle && <GrafanaVsSigNozFloatingCard />}
    </>
  )
}
