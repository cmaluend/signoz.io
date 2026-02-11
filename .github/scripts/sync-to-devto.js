const fs = require('fs')
const path = require('path')
const matter = require('gray-matter')

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const SIGNOZ_BASE_URL = 'https://signoz.io'

const ALLOWED_SECTIONS = ['blog', 'guides', 'opentelemetry', 'comparisons']

const CUSTOM_COMPONENTS = [
  { name: 'YouTube', pattern: /<YouTube[^>]*\/>/g },
  {
    name: 'GetStartedSigNoz',
    pattern: /<GetStartedSigNoz[^>]*\/>/g,
    replacement: `
## Get Started with SigNoz

You can choose between various deployment options in SigNoz. The easiest way to get started with SigNoz is [SigNoz cloud](https://signoz.io/teams/). We offer a 30-day free trial account with access to all features.

Those who have data privacy concerns and can't send their data outside their infrastructure can sign up for either [enterprise self-hosted or BYOC offering](https://signoz.io/contact-us/).

Those who have the expertise to manage SigNoz themselves or just want to start with a free self-hosted option can use our [community edition](https://signoz.io/docs/install/self-host/).
`,
  },
  { name: 'Admonition', pattern: /<Admonition[^>]*>[\s\S]*?<\/Admonition>/g },
  { name: 'SignUps', pattern: /<SignUps[^>]*\/>/g },
  { name: 'LogsPerf', pattern: /<LogsPerf[^>]*\/>/g },
  { name: 'VersionPin', pattern: /<VersionPin[^>]*\/>/g },
  { name: 'VersionPinNestJs', pattern: /<VersionPinNestJs[^>]*\/>/g },
  { name: 'Tabs', pattern: /<Tabs[^>]*>[\s\S]*?<\/Tabs>/g },
  { name: 'TabItem', pattern: /<TabItem[^>]*>[\s\S]*?<\/TabItem>/g },
  { name: 'DocCard', pattern: /<DocCard[^>]*\/>/g },
  { name: 'DocCardContainer', pattern: /<DocCardContainer[^>]*>[\s\S]*?<\/DocCardContainer>/g },
  { name: 'NextCarousel', pattern: /<NextCarousel[^>]*\/>/g },
  { name: 'PricingCTA', pattern: /<PricingCTA[^>]*\/>/g },
  { name: 'PageFeedback', pattern: /<PageFeedback[^>]*\/>/g },
  { name: 'CustomMetricPlayground', pattern: /<CustomMetricPlayground[^>]*\/>/g },
  { name: 'VerticalTabs', pattern: /<VerticalTabs[^>]*>[\s\S]*?<\/VerticalTabs>/g },
  { name: 'FAQAccordion', pattern: /<FAQAccordion[^>]*>[\s\S]*?<\/FAQAccordion>/g },
  { name: 'Button', pattern: /<Button[^>]*>[\s\S]*?<\/Button>/g },
  { name: 'DatadogPricingCalculator', pattern: /<DatadogPricingCalculator[^>]*\/>/g },
  { name: 'DatadogVsSigNoz', pattern: /<DatadogVsSigNoz[^>]*\/>/g },
  { name: 'GrafanaVsSigNoz', pattern: /<GrafanaVsSigNoz[^>]*\/>/g },
  { name: 'NewRelicVsSigNoz', pattern: /<NewRelicVsSigNoz[^>]*\/>/g },
  { name: 'DatadogAlternativesFinder', pattern: /<DatadogAlternativesFinder[^>]*\/>/g },
  { name: 'KeyPointCallout', pattern: /<KeyPointCallout[^>]*>[\s\S]*?<\/KeyPointCallout>/g },
  { name: 'GetStartedOpenTelemetryButton', pattern: /<GetStartedOpenTelemetryButton[^>]*\/>/g },
  { name: 'InterlinkCard', pattern: /<InterlinkCard[^>]*\/>/g },
  { name: 'InArticleVideoShowcaseModal', pattern: /<InArticleVideoShowcaseModal[^>]*\/>/g },
  {
    name: 'GetStartedInfrastructureMonitoring',
    pattern: /<GetStartedInfrastructureMonitoring[^>]*\/>/g,
  },
  { name: 'ImageCTA', pattern: /<ImageCTA[^>]*\/>/g },
  { name: 'TrackingLink', pattern: /<TrackingLink[^>]*>[\s\S]*?<\/TrackingLink>/g },
  { name: 'APMQuickStartOverview', pattern: /<APMQuickStartOverview[^>]*\/>/g },
  { name: 'APMInstrumentationListicle', pattern: /<APMInstrumentationListicle[^>]*\/>/g },
  { name: 'MDXButton', pattern: /<MDXButton[^>]*>[\s\S]*?<\/MDXButton>/g },
  { name: 'IconCardGrid', pattern: /<IconCardGrid[^>]*>[\s\S]*?<\/IconCardGrid>/g },
  { name: 'LogsQuickStartOverview', pattern: /<LogsQuickStartOverview[^>]*\/>/g },
  { name: 'LogsInstrumentationListicle', pattern: /<LogsInstrumentationListicle[^>]*\/>/g },
  { name: 'IntegrationsListicle', pattern: /<IntegrationsListicle[^>]*\/>/g },
  { name: 'HostingDecision', pattern: /<HostingDecision[^>]*\/>/g },
  { name: 'SelfHostInstallationListicle', pattern: /<SelfHostInstallationListicle[^>]*\/>/g },
  { name: 'K8sInstallationListicle', pattern: /<K8sInstallationListicle[^>]*\/>/g },
  { name: 'ArticleSeriesBottom', pattern: /<ArticleSeriesBottom[^>]*\/>/g },
  { name: 'ArticleSeriesTop', pattern: /<ArticleSeriesTop[^>]*\/>/g },
  {
    name: 'JavascriptInstrumentationListicle',
    pattern: /<JavascriptInstrumentationListicle[^>]*\/>/g,
  },
  { name: 'JavaInstrumentationListicle', pattern: /<JavaInstrumentationListicle[^>]*\/>/g },
  { name: 'LibraryTabs', pattern: /<LibraryTabs[^>]*>[\s\S]*?<\/LibraryTabs>/g },
  { name: 'LibraryTab', pattern: /<LibraryTab[^>]*>[\s\S]*?<\/LibraryTab>/g },
  { name: 'MigrateToSigNoz', pattern: /<MigrateToSigNoz[^>]*\/>/g },
  { name: 'DashboardTemplatesListicle', pattern: /<DashboardTemplatesListicle[^>]*\/>/g },
  { name: 'DashboardActions', pattern: /<DashboardActions[^>]*\/>/g },
  { name: 'KubernetesDashboardsListicle', pattern: /<KubernetesDashboardsListicle[^>]*\/>/g },
  { name: 'APMDashboardsListicle', pattern: /<APMDashboardsListicle[^>]*\/>/g },
  { name: 'HostMetricsDashboardsListicle', pattern: /<HostMetricsDashboardsListicle[^>]*\/>/g },
  { name: 'LiteLLMDashboardsListicle', pattern: /<LiteLLMDashboardsListicle[^>]*\/>/g },
  { name: 'MarketplaceInstallationListicle', pattern: /<MarketplaceInstallationListicle[^>]*\/>/g },
  { name: 'LLMMonitoringListicle', pattern: /<LLMMonitoringListicle[^>]*\/>/g },
  { name: 'OtelCollectorFlow', pattern: /<OtelCollectorFlow[^>]*\/>/g },
  { name: 'CollectionAgentsListicle', pattern: /<CollectionAgentsListicle[^>]*\/>/g },
  { name: 'ResponseTimeVisualizer', pattern: /<ResponseTimeVisualizer[^>]*\/>/g },
  { name: 'ProductFeatureShowcase', pattern: /<ProductFeatureShowcase[^>]*\/>/g },
  { name: 'MetricsQuickStartOverview', pattern: /<MetricsQuickStartOverview[^>]*\/>/g },
  { name: 'CICDMonitoringListicle', pattern: /<CICDMonitoringListicle[^>]*\/>/g },
  { name: 'AWSMonitoringListicle', pattern: /<AWSMonitoringListicle[^>]*\/>/g },
  { name: 'AWSOneClickListicle', pattern: /<AWSOneClickListicle[^>]*\/>/g },
  { name: 'CardinalityExplosion', pattern: /<CardinalityExplosion[^>]*\/>/g },
  { name: 'MemoryGauge', pattern: /<MemoryGauge[^>]*\/>/g },
  { name: 'QueryRace', pattern: /<QueryRace[^>]*\/>/g },
  { name: 'SamplingAggregation', pattern: /<SamplingAggregation[^>]*\/>/g },
  { name: 'UsersAnalogy', pattern: /<UsersAnalogy[^>]*\/>/g },
  { name: 'Tooltip', pattern: /<Tooltip[^>]*>[\s\S]*?<\/Tooltip>/g },
  { name: 'DatabaseTable', pattern: /<DatabaseTable[^>]*\/>/g },
  { name: 'Region', pattern: /<Region[^>]*>[\s\S]*?<\/Region>/g },
  { name: 'region', pattern: /<region[^>]*>[\s\S]*?<\/region>/g },
  { name: 'RegionTable', pattern: /<RegionTable[^>]*\/>/g },
  { name: 'ToggleHeading', pattern: /<ToggleHeading[^>]*>[\s\S]*?<\/ToggleHeading>/g },
  { name: 'TOCInline', pattern: /<TOCInline[^>]*\/>/g },
  { name: 'BlogNewsletterForm', pattern: /<BlogNewsletterForm[^>]*\/>/g },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function stripHtmlTags(value) {
  return value.replace(/<[^>]+>/g, '').trim()
}

function ensureTrailingSlash(value) {
  return value.endsWith('/') ? value : `${value}/`
}

function detectSectionFromPath(filePath) {
  if (!filePath) return undefined
  const segments = filePath.replace(/\\/g, '/').split('/').filter(Boolean)
  const normalized = segments.map((s) => s.toLowerCase())
  const idx = normalized.findIndex((s) => ALLOWED_SECTIONS.includes(s))
  return idx !== -1 ? normalized[idx] : undefined
}

function sanitizeTagForDevTo(tag) {
  return tag
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 20)
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ---------------------------------------------------------------------------
// Markdown parsing & conversion (ported from converter.ts)
// ---------------------------------------------------------------------------

function parseMarkdownFile(content, fileName, filePath) {
  const { data: frontmatter, content: rawMarkdown } = matter(content)

  // Strip "Was this page helpful?" trailing section
  let markdownContent = rawMarkdown.replace(
    /(?:^|\n{1,2})#{2,6}\s+Was\s+this\s+page\s+helpful\?[\s\S]*$/i,
    ''
  )

  const slug = frontmatter.slug || fileName.replace(/\.(md|mdx)$/, '')

  // Build canonical URL
  const section = detectSectionFromPath(filePath) || 'blog'
  const normalizedSlug = String(slug)
    .trim()
    .replace(/^\/+|\/+$/g, '')
  const slugPath = normalizedSlug.startsWith(`${section}/`)
    ? normalizedSlug
    : `${section}/${normalizedSlug}`
  const canonicalUrl = ensureTrailingSlash(`${SIGNOZ_BASE_URL}/${slugPath}`)

  // Derive title
  const titleFromFrontmatter =
    typeof frontmatter.title === 'string' && frontmatter.title.trim().length > 0
      ? frontmatter.title.trim()
      : undefined

  let derivedTitle = titleFromFrontmatter
  if (!derivedTitle) {
    const headingMatch = markdownContent.match(/(?:^|\n)\s{0,3}#\s+(.+?)\s*(?:\n|$)/)
    if (headingMatch && headingMatch[1]) {
      derivedTitle = stripHtmlTags(headingMatch[1].trim())
    }
  }

  // Remove leading H1 if title came from the heading
  if (!titleFromFrontmatter && derivedTitle) {
    markdownContent = markdownContent
      .replace(/^[\uFEFF\s]{0,3}#\s+.+?(?:\r?\n|$)/, '')
      .replace(/^\s+/, '')
  }

  const tags = Array.isArray(frontmatter.tags)
    ? frontmatter.tags
    : frontmatter.tags
      ? [frontmatter.tags]
      : []

  return {
    metadata: {
      title: derivedTitle || 'Untitled Article',
      slug,
      tags,
      canonicalUrl,
      series: frontmatter.series,
      draft: frontmatter.draft === true,
    },
    content: markdownContent,
  }
}

function convertMarkdown(content) {
  let converted = content

  // Strip <head> blocks
  converted = converted.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')

  // Normalize code fences
  converted = converted.replace(/```([\w+-]+)\s+code-highlight/gi, '```$1')
  converted = converted.replace(/```\s*code-highlight/gi, '```')

  // Convert <figure> with <img> and optional <figcaption>
  converted = converted.replace(
    /<figure[^>]*>[\s\S]*?<img\s+[^>]*src="([^"]+)"[^>]*>[\s\S]*?<\/figure>/gi,
    (match, src) => {
      const altMatch = match.match(/alt="([^"]*)"/i)
      const figCaptionMatch = match.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i)
      const captionText = figCaptionMatch ? stripHtmlTags(figCaptionMatch[1]) : ''
      const altText = altMatch ? altMatch[1] : ''
      const text = (captionText || altText).trim()
      const fullUrl = src.startsWith('/') ? `${SIGNOZ_BASE_URL}${src}` : src
      return `![${text}](${fullUrl})`
    }
  )

  // Remove/replace custom components
  for (const component of CUSTOM_COMPONENTS) {
    converted = converted.replace(component.pattern, component.replacement || '')
  }

  // Convert remaining <img> tags to markdown
  converted = converted.replace(/<img\s+[^>]*src="([^"]+)"[^>]*>/gi, (raw, src) => {
    const altMatch = raw.match(/alt="([^"]*)"/i)
    const alt = altMatch ? altMatch[1] : ''
    const fullUrl = src.startsWith('/') ? `${SIGNOZ_BASE_URL}${src}` : src
    return `![${alt}](${fullUrl})`
  })

  // Absolutize relative markdown image paths
  converted = converted.replace(/!\[(.*?)\]\((\/[^)]+)\)/g, (_, altText, imgPath) => {
    return `![${altText}](${SIGNOZ_BASE_URL}${imgPath})`
  })

  // Convert remaining <figcaption> to italic captions
  converted = converted.replace(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/gi, (_, caption) => {
    const text = stripHtmlTags(caption)
    return text ? `*${text}*` : ''
  })

  // Convert <Figure> with src, alt, caption
  converted = converted.replace(
    /<Figure\s+src="([^"]+)"\s+alt="([^"]+)"\s+caption="([^"]+)"\s*\/>/g,
    (_, src, alt, caption) => {
      const fullUrl = src.startsWith('/') ? `${SIGNOZ_BASE_URL}${src}` : src
      return `![${alt}](${fullUrl})\n*${caption}*`
    }
  )

  // Convert <Figure> without caption
  converted = converted.replace(/<Figure\s+src="([^"]+)"\s+alt="([^"]+)"\s*\/>/g, (_, src, alt) => {
    const fullUrl = src.startsWith('/') ? `${SIGNOZ_BASE_URL}${src}` : src
    return `![${alt}](${fullUrl})`
  })

  // Collapse excessive newlines
  converted = converted.replace(/\n{3,}/g, '\n\n')

  return converted.trim()
}

// ---------------------------------------------------------------------------
// Dev.to API (ported from route.ts)
// ---------------------------------------------------------------------------

async function fetchExistingArticles(apiKey) {
  const canonicalMap = new Map()
  let organizationId = undefined
  const perPage = 1000

  for (let page = 1; page <= 50; page++) {
    const url = `https://dev.to/api/articles/me?page=${page}&per_page=${perPage}`
    const response = await fetch(url, {
      headers: { 'api-key': apiKey },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Failed to fetch existing articles: ${response.status} ${errorText}`)
      break
    }

    const articles = await response.json()
    if (!Array.isArray(articles) || articles.length === 0) break

    for (const article of articles) {
      if (article.canonical_url) {
        canonicalMap.set(article.canonical_url, {
          id: article.id,
          url: article.url,
        })
      }
      if (
        !organizationId &&
        article.organization &&
        article.organization.slug === 'signoz' &&
        typeof article.organization.id === 'number'
      ) {
        organizationId = article.organization.id
      }
    }

    if (articles.length < perPage) break
  }

  return { articlesByCanonical: canonicalMap, organizationId }
}

function buildDevToPayload(article, organizationId) {
  return {
    article: {
      title: article.title,
      published: true,
      body_markdown: article.content,
      tags: article.tags,
      series: article.series || null,
      canonical_url: article.canonicalUrl || null,
      organization_id: organizationId || undefined,
    },
  }
}

async function apiCallWithRetry(fn, maxRetries = 3) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const result = await fn()
    if (result.status === 429 && attempt < maxRetries) {
      const backoff = Math.pow(2, attempt) * 1000
      console.log(
        `Rate limited (429). Retrying in ${backoff}ms... (attempt ${attempt + 1}/${maxRetries})`
      )
      await sleep(backoff)
      continue
    }
    return result
  }
}

async function publishToDevTo(article, apiKey, organizationId) {
  const payload = buildDevToPayload(article, organizationId)
  const response = await apiCallWithRetry(() =>
    fetch('https://dev.to/api/articles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify(payload),
    })
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to publish: ${response.status} ${error}`)
  }

  const result = await response.json()
  return result.url
}

async function updateDevToArticle(article, articleId, apiKey, organizationId) {
  const payload = buildDevToPayload(article, organizationId)
  const response = await apiCallWithRetry(() =>
    fetch(`https://dev.to/api/articles/${articleId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify(payload),
    })
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to update: ${response.status} ${error}`)
  }

  const result = await response.json()
  return result.url
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const apiKey = process.env.DEVTO_API_KEY
  if (!apiKey) {
    console.error('DEVTO_API_KEY is required')
    process.exit(1)
  }

  const changedFilesPath = process.env.CHANGED_FILES_PATH
  if (!changedFilesPath) {
    console.error('CHANGED_FILES_PATH is required')
    process.exit(1)
  }

  let changedFiles
  try {
    const raw = fs.readFileSync(changedFilesPath, 'utf8')
    changedFiles = JSON.parse(raw)
  } catch (err) {
    console.error(`Failed to read changed files from ${changedFilesPath}: ${err.message}`)
    process.exit(1)
  }

  if (!Array.isArray(changedFiles) || changedFiles.length === 0) {
    console.log('No changed files to process.')
    writeResults({ published: [], updated: [], skipped: [], errors: [] })
    process.exit(0)
  }

  // Filter to .mdx files in allowed directories
  const mdxFiles = changedFiles.filter((f) => {
    if (!f.endsWith('.mdx')) return false
    return ALLOWED_SECTIONS.some((section) => f.startsWith(`data/${section}/`))
  })

  if (mdxFiles.length === 0) {
    console.log('No MDX files in target directories.')
    writeResults({ published: [], updated: [], skipped: [], errors: [] })
    process.exit(0)
  }

  console.log(`Processing ${mdxFiles.length} MDX file(s)...`)

  // Fetch existing Dev.to articles for deduplication
  console.log('Fetching existing Dev.to articles...')
  const { articlesByCanonical, organizationId: autoOrgId } = await fetchExistingArticles(apiKey)
  console.log(`Found ${articlesByCanonical.size} existing article(s) on Dev.to`)

  // Resolve organization ID
  const envOrgId = process.env.DEVTO_ORGANIZATION_ID
    ? Number(process.env.DEVTO_ORGANIZATION_ID)
    : undefined
  const organizationId = autoOrgId || (Number.isFinite(envOrgId) ? envOrgId : undefined)

  if (organizationId) {
    console.log(`Using organization ID: ${organizationId}`)
  }

  const results = { published: [], updated: [], skipped: [], errors: [] }
  const dryRun = process.env.DRY_RUN === 'true'

  for (const file of mdxFiles) {
    try {
      console.log(`\nProcessing: ${file}`)

      if (!fs.existsSync(file)) {
        console.log(`  File not found (likely deleted), skipping.`)
        results.skipped.push({ file, reason: 'file not found (deleted)' })
        continue
      }

      const raw = fs.readFileSync(file, 'utf8')
      const fileName = path.basename(file)
      const { metadata, content: markdownContent } = parseMarkdownFile(raw, fileName, file)

      // Skip draft articles
      if (metadata.draft) {
        console.log(`  Skipping draft: ${metadata.title}`)
        results.skipped.push({ file, reason: 'draft article' })
        continue
      }

      const convertedContent = convertMarkdown(markdownContent)

      // Sanitize tags
      let tags = metadata.tags
        .map(sanitizeTagForDevTo)
        .filter((t) => t.length > 0)
        .slice(0, 4)
      if (tags.length === 0) tags = ['signoz']

      const article = {
        title: metadata.title,
        content: convertedContent,
        tags,
        canonicalUrl: metadata.canonicalUrl,
        series: metadata.series,
      }

      console.log(`  Title: ${article.title}`)
      console.log(`  Canonical: ${article.canonicalUrl}`)
      console.log(`  Tags: ${article.tags.join(', ')}`)

      if (dryRun) {
        console.log(`  [DRY RUN] Would publish/update. Content length: ${convertedContent.length}`)
        results.published.push({
          file,
          slug: metadata.slug,
          devToUrl: '(dry run)',
          canonicalUrl: article.canonicalUrl,
        })
        continue
      }

      const existing = article.canonicalUrl
        ? articlesByCanonical.get(article.canonicalUrl)
        : undefined

      if (existing && existing.id) {
        // Update existing article
        console.log(`  Updating existing Dev.to article (ID: ${existing.id})...`)
        const devToUrl = await updateDevToArticle(article, existing.id, apiKey, organizationId)
        console.log(`  Updated: ${devToUrl}`)
        results.updated.push({
          file,
          slug: metadata.slug,
          devToUrl,
          canonicalUrl: article.canonicalUrl,
        })
      } else {
        // Publish new article
        console.log(`  Publishing new article...`)
        const devToUrl = await publishToDevTo(article, apiKey, organizationId)
        console.log(`  Published: ${devToUrl}`)
        results.published.push({
          file,
          slug: metadata.slug,
          devToUrl,
          canonicalUrl: article.canonicalUrl,
        })

        // Track the new article to avoid re-publishing within same run
        if (article.canonicalUrl) {
          articlesByCanonical.set(article.canonicalUrl, { url: devToUrl })
        }
      }

      // Rate limit: sleep 1s between API calls
      await sleep(1000)
    } catch (err) {
      console.error(`  Error processing ${file}: ${err.message}`)
      results.errors.push({ file, error: err.message })
    }
  }

  writeResults(results)
  writeSummary(results)

  console.log('\nSync complete.')
  console.log(
    `  Published: ${results.published.length}, Updated: ${results.updated.length}, ` +
      `Skipped: ${results.skipped.length}, Errors: ${results.errors.length}`
  )
}

// ---------------------------------------------------------------------------
// Output helpers
// ---------------------------------------------------------------------------

function writeResults(results) {
  fs.writeFileSync('devto-sync-results.json', JSON.stringify(results, null, 2))
}

function writeSummary(results) {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY
  if (!summaryPath) return

  let md = '## Dev.to Sync Results\n\n'
  md += '| Status | Count |\n'
  md += '|--------|-------|\n'
  md += `| Published | ${results.published.length} |\n`
  md += `| Updated | ${results.updated.length} |\n`
  md += `| Skipped | ${results.skipped.length} |\n`
  md += `| Errors | ${results.errors.length} |\n\n`

  if (results.published.length > 0) {
    md += '### Published\n\n'
    for (const item of results.published) {
      md += `- [${item.slug}](${item.devToUrl}) (canonical: ${item.canonicalUrl})\n`
    }
    md += '\n'
  }

  if (results.updated.length > 0) {
    md += '### Updated\n\n'
    for (const item of results.updated) {
      md += `- [${item.slug}](${item.devToUrl}) (canonical: ${item.canonicalUrl})\n`
    }
    md += '\n'
  }

  if (results.errors.length > 0) {
    md += '### Errors\n\n'
    for (const item of results.errors) {
      md += `- \`${item.file}\`: ${item.error}\n`
    }
    md += '\n'
  }

  fs.appendFileSync(summaryPath, md)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
