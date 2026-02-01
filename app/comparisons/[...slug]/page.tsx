import 'css/prism.css'
import 'katex/dist/katex.css'

import { components } from '@/components/MDXComponents'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import siteMetadata from '@/data/siteMetadata'
import { getHubContextForRoute } from '@/utils/opentelemetryHub'
import ComparisonsLayout from '@/layouts/ComparisonsLayout'
import OpenTelemetryLayout from '@/layouts/OpenTelemetryLayout'
import OpenTelemetryHubLayout from '@/layouts/OpenTelemetryHubLayout'
import PageFeedback from '@/components/PageFeedback/PageFeedback'
import { fetchMDXContentByPath, MDXContent } from '@/utils/strapi'
import { generateStructuredData } from '@/utils/structuredData'
import { compileMDX } from 'next-mdx-remote/rsc'
import readingTime from 'reading-time'
import GithubSlugger from 'github-slugger'

// Remark and rehype plugins
import remarkGfm from 'remark-gfm'
import {
  remarkExtractFrontmatter,
  remarkCodeTitles,
  remarkImgToJsx,
} from 'pliny/mdx-plugins/index.js'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypePrismPlus from 'rehype-prism-plus'
import remarkMath from 'remark-math'
import { fromHtmlIsomorphic } from 'hast-util-from-html-isomorphic'

export const dynamicParams = true
export const revalidate = 0

const defaultLayout = 'ComparisonsLayout'
const layouts = {
  OpenTelemetryLayout,
  ComparisonsLayout,
}

// Heroicon mini link for auto-linking headers
const linkIcon = fromHtmlIsomorphic(
  `<span class="content-header-link">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 linkicon">
      <path d="M12.232 4.232a2.5 2.5 0 0 1 3.536 3.536l-1.225 1.224a.75.75 0 0 0 1.061 1.06l1.224-1.224a4 4 0 0 0-5.656-5.656l-3 3a4 4 0 0 0 .225 5.865.75.75 0 0 0 .977-1.138 2.5 2.5 0 0 1-.142-3.667l3-3Z" />
      <path d="M11.603 7.963a.75.75 0 0 0-.977 1.138 2.5 2.5 0 0 1 .142 3.667l-3 3a2.5 2.5 0 0 1-3.536-3.536l1.225-1.224a.75.75 0 0 0-1.061-1.06l-1.224 1.224a4 4 0 1 0 5.656 5.656l3-3a4 4 0 0 0-.225-5.865Z" />
    </svg>
  </span>`,
  { fragment: true }
)

// MDX processing options with all plugins
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
          content: linkIcon,
        },
      ],
      [rehypePrismPlus, { defaultLanguage: 'tsx', ignoreMissing: true }],
    ],
  },
}

// Generate table of contents from MDX content
function generateTOC(content: string) {
  const regXHeader = /\n(?<flag>#{1,3})\s+(?<content>.+)/g
  const slugger = new GithubSlugger()

  // Remove code blocks to avoid parsing headers inside code
  const regXCodeBlock = /```[\s\S]*?```/g
  const contentWithoutCodeBlocks = content.replace(regXCodeBlock, '')

  const headings = Array.from(contentWithoutCodeBlocks.matchAll(regXHeader))
    .map(({ groups }) => {
      const flag = groups?.flag
      const content = groups?.content
      if (!content) return null
      return {
        value: content,
        url: `#${slugger.slug(content)}`,
        depth: flag?.length == 1 ? 1 : flag?.length == 2 ? 2 : 3,
      }
    })
    .filter((heading): heading is NonNullable<typeof heading> => heading !== null)

  return headings
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string[] }
}): Promise<Metadata | undefined> {
  const slug = decodeURI(params.slug.join('/'))

  const isProduction = process.env.VERCEL_ENV === 'production'
  const deploymentStatus = isProduction ? 'live' : 'staging'

  try {
    const response = await fetchMDXContentByPath('comparisons', slug, deploymentStatus)
    if (!response || !response.data) {
      return notFound()
    }
    const post = Array.isArray(response.data) ? response.data[0] : response.data

    const publishedAt = new Date(post.publishedAt).toISOString()
    const modifiedAt = new Date(post.updatedAt || post.publishedAt).toISOString()

    // Extract author names from the content
    const authors = post.authors?.map((author: any) => author?.name) || [siteMetadata.author]

    let imageList = [siteMetadata.socialBanner]
    if (post.image) {
      imageList = typeof post.image === 'string' ? [post.image] : post.image
    }
    const ogImages = imageList.map((img) => {
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
        authors: authors,
      },
      twitter: {
        card: 'summary_large_image',
        title: post.title,
        description: post?.description || post?.excerpt,
        images: imageList,
      },
    }
  } catch (error) {
    console.error('Error fetching comparison metadata:', error)
    return {
      title: 'Error',
      description: 'An error occurred while loading the comparison page.',
    }
  }
}

export const generateStaticParams = async () => {
  return []
}

export default async function Page({ params }: { params: { slug: string[] } }) {
  const slug = decodeURI(params.slug.join('/'))
  const currentRoute = `/comparisons/${slug}`

  const isProduction = process.env.VERCEL_ENV === 'production'
  const deploymentStatus = isProduction ? 'live' : 'staging'

  let post: MDXContent
  try {
    const response = await fetchMDXContentByPath('comparisons', slug, deploymentStatus)
    if (!response || !response.data) {
      console.error(`Invalid response for path: ${slug}`)
      notFound()
    }
    post = (Array.isArray(response.data) ? response.data[0] : response.data) as MDXContent
  } catch (error) {
    console.error('Error fetching comparison content:', error)
    notFound()
  }

  // Generate computed fields
  const readingTimeData = readingTime(post?.content)
  const toc = generateTOC(post?.content)

  // Compile MDX content
  let compiledContent
  try {
    const { content: mdxContent } = await compileMDX({
      source: post?.content,
      components,
      options: mdxOptions as any,
    })
    compiledContent = mdxContent
  } catch (error) {
    console.error('Error compiling MDX:', error)
    notFound()
  }

  // Generate structured data
  const structuredData = generateStructuredData('comparisons', post)

  // Construct mainContent object
  const mainContent = {
    ...post,
    date: post.publishedAt,
    lastmod: post.updatedAt,
    slug: slug,
    path: `comparisons${post.path}` || currentRoute,
    tags: post.tags?.map((tag: any) => tag.value) || [],
    readingTime: readingTimeData,
    toc: toc,
    authors: post.authors?.map((author: any) => author?.name) || [],
    structuredData: structuredData,
    relatedArticles:
      post.related_comparisons?.map((comp: any) => ({
        ...comp,
        url: `/comparisons${comp.path}`,
        publishedOn: comp.date || comp.updatedAt || comp.publishedAt,
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
    slug: author.key || 'default',
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
      slug: 'default',
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
        <OpenTelemetryHubLayout
          content={mainContent as any}
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
          {compiledContent}
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
    layoutName = 'ComparisonsLayout'
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
      <Layout
        content={mainContent as any}
        authorDetails={authorDetails}
        authors={authorNames}
        toc={toc}
      >
        {compiledContent}
      </Layout>
    </>
  )
}
