import { escape } from 'pliny/utils/htmlEscaper.js'

const DEFAULT_COLLECTION_PATH = 'blog'
export const DEFAULT_RSS_PAGE = 'feed.xml'

const sourcePathToCollection = (sourcePath) => {
  if (!sourcePath) return DEFAULT_COLLECTION_PATH

  if (sourcePath.startsWith('docs/')) return 'docs'
  if (sourcePath.startsWith('comparisons/')) return 'comparisons'
  if (sourcePath.startsWith('guides/')) return 'guides'
  if (sourcePath.startsWith('opentelemetry/')) return 'opentelemetry'
  if (sourcePath.startsWith('faqs/')) return ''

  return DEFAULT_COLLECTION_PATH
}

export const resolvePostUrlPath = (post) => {
  const sourcePath = post?._raw?.sourceFilePath ?? post?.slug ?? ''
  return sourcePathToCollection(sourcePath)
}

export const generateRssItem = (config, post) => {
  const urlPath = resolvePostUrlPath(post)

  return `
  <item>
    <guid>${config.siteUrl}${urlPath?.length > 0 ? `/${urlPath}/` : '/'}${post.slug}</guid>
    <title>${escape(post.title)}</title>
    <link>${config.siteUrl}${urlPath?.length > 0 ? `/${urlPath}/` : '/'}${post.slug}</link>
    ${post.summary || post.description ? `<description>${escape(post.summary || post.description)}</description>` : ''}
    <pubDate>${new Date(post.date).toUTCString()}</pubDate>
    <author>${config.email} (${config.author})</author>
    ${post.tags ? post.tags.map((t) => (typeof t === 'string' ? `<category>${t}</category>` : `<category>${t.value}</category>`)).join('') : ''}
  </item>
`
}

export const generateRss = (config, posts, page = DEFAULT_RSS_PAGE) => {
  const publishedPosts = Array.isArray(posts) ? posts.filter((post) => post) : []

  if (publishedPosts.length === 0) {
    return `
  <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
      <title>${escape(config.title)}</title>
      <link>${config.siteUrl}/blog</link>
      <description>${escape(config.description)}</description>
      <language>${config.language}</language>
      <managingEditor>${config.email} (${config.author})</managingEditor>
      <webMaster>${config.email} (${config.author})</webMaster>
      <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
      <atom:link href="${config.siteUrl}/${page}" rel="self" type="application/rss+xml"/>
    </channel>
  </rss>
`
  }

  return `
  <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
      <title>${escape(config.title)}</title>
      <link>${config.siteUrl}/blog</link>
      <description>${escape(config.description)}</description>
      <language>${config.language}</language>
      <managingEditor>${config.email} (${config.author})</managingEditor>
      <webMaster>${config.email} (${config.author})</webMaster>
      <lastBuildDate>${new Date(publishedPosts[0].date).toUTCString()}</lastBuildDate>
      <atom:link href="${config.siteUrl}/${page}" rel="self" type="application/rss+xml"/>
      ${publishedPosts.map((post) => generateRssItem(config, post)).join('')}
    </channel>
  </rss>
`
}
