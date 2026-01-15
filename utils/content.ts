import GithubSlugger from 'github-slugger'
import siteMetadata from '@/data/siteMetadata'
import readingTime from 'reading-time'
import comparisonsRelatedArticles from '@/constants/comparisonsRelatedArticles.json'

// Types
export type TOCItem = {
  value: string
  url: string
  depth: number
}

// Generate TOC from markdown content
export const generateTOC = (content: string): TOCItem[] => {
  const regXHeader = /\n(?<flag>#{1,3})\s+(?<content>.+)/g
  const slugger = new GithubSlugger()

  const regXCodeBlock = /```[\s\S]*?```/g
  const contentWithoutCodeBlocks = content.replace(regXCodeBlock, '')

  const headings = Array.from(contentWithoutCodeBlocks.matchAll(regXHeader)).map(({ groups }) => {
    const flag = groups?.flag
    const content = groups?.content
    return {
      value: content || '',
      url: content ? `#${slugger.slug(content)}` : '',
      depth: flag?.length == 1 ? 1 : flag?.length == 2 ? 2 : 3,
    }
  })

  return headings
}

// Get related articles
export const getRelatedArticles = (slug: string, collectionRelatedArticles: any[]) => {
  // Contentlayer flattenedPath usually doesn't have leading slash, but let's handle both
  const cleanSlug = slug.replace(/^\//, '')
  // Also check if collectionRelatedArticles uses full path or just slug.
  // In contentlayer config: blog.blogURL === blogSlug
  // blogSlug is flattenedPath e.g. "comparisons/foo"

  // We need to construct what the key would be.
  // If usage is 'comparisons/slug', then:
  const key = `comparisons/${cleanSlug}`

  const blog = collectionRelatedArticles.find((blog) => {
    return blog.blogURL === key || blog.blogURL === cleanSlug
  })

  if (blog) {
    return blog.relatedArticles
  } else {
    return []
  }
}

// Generate Structured Data
export const generateStructuredData = (doc: any, urlPath: string) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://signoz.io/${urlPath}`,
    },
    author: doc.authors?.map((author: any) => ({
      '@type': 'Person',
      name: author.name || 'SigNoz Team',
    })) || [
      {
        '@type': 'Organization',
        name: 'SigNoz',
      },
    ],
    publisher: {
      '@type': 'Organization',
      name: 'SigNoz',
      logo: {
        '@type': 'ImageObject',
        url: 'https://signoz.io/img/SigNozLogo-orange.svg',
      },
    },
    headline: doc.title,
    datePublished: doc.publishedAt || doc.date,
    dateModified: doc.updatedAt || doc.lastmod || doc.date,
    description: doc.description,
    image: `${siteMetadata.siteUrl}${doc.image || (doc.images ? doc.images[0] : siteMetadata.socialBanner)}`,
    url: `${siteMetadata.siteUrl}/${urlPath}`,
  }
}

export const calculateReadingTime = (content: string) => {
  return readingTime(content)
}
