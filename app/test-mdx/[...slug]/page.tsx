import { notFound } from 'next/navigation'
import { fetchMDXContentByPath, fetchAllMDXPaths, MDXContent } from '@/utils/strapi'
import { compileMDX } from 'next-mdx-remote/rsc'
import { components } from '@/components/MDXComponents'
import { Metadata } from 'next'
import readingTime from 'reading-time'
import GithubSlugger from 'github-slugger'
import { fromHtmlIsomorphic } from 'hast-util-from-html-isomorphic'

// Remark and rehype plugins
import remarkGfm from 'remark-gfm'
import { remarkExtractFrontmatter, remarkCodeTitles, remarkImgToJsx } from 'pliny/mdx-plugins/index.js'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypePrismPlus from 'rehype-prism-plus'

// ISR Configuration
export const revalidate = 3600 // Revalidate every hour
export const dynamicParams = true // Allow runtime generation of new paths
export const dynamic = 'force-static' // Enable static generation with ISR

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
  }
}

// Generate table of contents from MDX content
function generateTOC(content: string) {
  const regXHeader = /\n(?<flag>#{1,3})\s+(?<content>.+)/g
  const slugger = new GithubSlugger()

  // Remove code blocks to avoid parsing headers inside code
  const regXCodeBlock = /```[\s\S]*?```/g
  const contentWithoutCodeBlocks = content.replace(regXCodeBlock, '')

  const headings = Array.from(contentWithoutCodeBlocks.matchAll(regXHeader)).map(
    ({ groups }) => {
      const flag = groups?.flag
      const content = groups?.content
      return {
        value: content,
        url: content ? `#${slugger.slug(content)}` : undefined,
        depth: flag?.length == 1 ? 1 : flag?.length == 2 ? 2 : 3,
      }
    }
  )

  return headings
}

// Generate static params for build-time generation (limit to top pages for performance)
export async function generateStaticParams() {
  try {
    const paths = await fetchAllMDXPaths()

    // Limit to top 50 pages to prevent long build times
    const priorityPaths = paths
      .slice(0, 50)
      .map((path) => ({
        slug: path === '/' ? [] : path.split('/').filter(Boolean),
      }))

    console.log(`Generated ${priorityPaths.length} static params for build time`)
    return priorityPaths
  } catch (error) {
    console.error('Error generating static params:', error)
    // Return empty array to allow all pages to be generated on-demand
    return []
  }
}

// Generate metadata for SEO optimization
export async function generateMetadata({
  params,
}: {
  params: { slug?: string[] }
}): Promise<Metadata> {
  try {
    // Handle root case
    if (!params.slug || params.slug.length === 0) {
      return {
        title: 'Test MDX from Strapi',
        description: 'Test implementation for rendering MDX content from Strapi CMS using ISR',
        openGraph: {
          title: 'Test MDX from Strapi',
          description: 'Test implementation for rendering MDX content from Strapi CMS using ISR',
          type: 'website',
        },
      }
    }

    // Convert slug array to path
    const path = params.slug.join('/')

    try {
      const { data: content } = await fetchMDXContentByPath(path)

      return {
        title: content.title,
        description: content?.excerpt || `Read about ${content.title}`,
        // keywords: content?.keywords, // TODO: Add keyword support later
        authors: [{ name: 'SigNoz Team' }],
        openGraph: {
          title: content.title,
          description: content?.excerpt || `Read about ${content.title}`,
          type: 'article',
          publishedTime: content?.publishedAt,
          modifiedTime: content?.updatedAt,
          url: `/${path}`,
        },
        twitter: {
          card: 'summary_large_image',
          title: content.title,
          description: content?.excerpt || `Read about ${content.title}`,
        },
      }
    } catch (error) {
      // Content not found, return 404 metadata
      return {
        title: 'Page Not Found',
        description: 'The requested page could not be found.',
      }
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: 'Error',
      description: 'An error occurred while loading the page.',
    }
  }
}

// Main page component
export default async function TestMDXPage({
  params,
}: {
  params: { slug?: string[] }
}) {
  console.log('Rendering page with params:', params)

  try {
    // Handle root case (landing page)
    if (!params.slug || params.slug.length === 0) {
      return (
        <div className="min-h-screen">something something test here blabla</div>
      )
    }

    const path = params.slug[0] === 'test-mdx' && params.slug.length > 1
      ? `test-mdx/${params.slug.slice(1).join('/')}`
      : params.slug.join('/')
    console.log(`Fetching content for path: ${path}`)

    // Fetch content from Strapi with error handling
    let content: MDXContent
    try {
      if (!process.env.NEXT_PUBLIC_SIGNOZ_CMS_API_URL) {
        throw new Error('Strapi API URL is not configured')
      }
      
      const response = await fetchMDXContentByPath(path)
      if (!response || !response.data) {
        console.error(`Invalid response for path: ${path}`)
        notFound()
      }
      content = response.data
    } catch (error) {
      console.error(`Error fetching content for path: ${path}`, error)
      if (error instanceof Error && error.message.includes('not configured')) {
        throw error // Re-throw configuration errors
      }
      notFound()
    }

    if (!content) {
      console.log(`No content returned for path: ${path}`)
      notFound()
    }

    console.log(`Successfully fetched content: ${content?.title}`)

    // Generate computed fields similar to contentlayer
    const readingTimeData = readingTime(content?.content)
    const toc = generateTOC(content?.content)

    // Compile MDX content with all plugins
    let compiledContent
    try {
      const { content: mdxContent } = await compileMDX({
        source: content?.content,
        components,
        options: mdxOptions as any,
      })
      compiledContent = mdxContent
    } catch (error) {
      console.error('Error compiling MDX:', error)
      return notFound()
    }

    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main content */}
            <article className="lg:col-span-3">
              <header className="mb-8 pb-8 border-b border-gray-200">
                <h1 className="text-4xl font-bold mb-4">
                  {content?.title}
                </h1>

                {content?.excerpt && (
                  <p className="text-xl mb-6">{content?.excerpt}</p>
                )}

                <div className="flex items-center space-x-4 text-sm">
                  <time dateTime={content?.publishedAt}>
                    Published: {new Date(content?.publishedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </time>

                  {content?.updatedAt !== content?.publishedAt && (
                    <span>
                      Updated: {new Date(content?.updatedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long', 
                        day: 'numeric'
                      })}
                    </span>
                  )}

                  <span>•</span>
                  <span>{readingTimeData.text}</span>
                </div>
              </header>

              {/* MDX Content */}
              <div className="prose prose-lg max-w-none prose-headings:scroll-mt-16 dark:prose-invert">
                {compiledContent}
              </div>
            </article>

            {/* Sidebar with Table of Contents */}
            {toc.length > 0 && (
              <aside className="lg:col-span-1">
                <div className="sticky top-8">
                  <div className="rounded-lg p-6">
                    <h2 className="text-lg font-semibold mb-4">
                      Table of Contents
                    </h2>
                    <nav>
                      <ul className="space-y-2 text-sm">
                        {toc.map((heading, index) => (
                          <li 
                            key={index} 
                            className={`${
                              heading.depth === 2 ? 'ml-0' : 
                              heading.depth === 3 ? 'ml-4' : 'ml-8'
                            }`}
                          >
                            <a
                              href={heading.url}
                              className="transition-colors duration-200 block py-1"
                            >
                              {heading.value}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </nav>
                  </div>
                </div>
              </aside>
            )}
          </div>
        </div>
      </div>
    )

  } catch (error) {
    console.error('Unexpected error rendering MDX page:', error)
    return notFound()
  }
}
