const fs = require('fs')
const path = require('path')

module.exports = async ({ github, context, core }) => {
  let results = null
  try {
    const resultsPath = path.join(process.cwd(), 'devto-sync-results.json')
    const raw = fs.readFileSync(resultsPath, 'utf8')
    results = JSON.parse(raw)
  } catch (err) {
    console.error('Failed to read devto-sync-results.json:', err.message)
  }

  let body = ''

  if (!results) {
    body = '**Dev.to Sync**: No results file found. Check the workflow logs for details.'
  } else {
    const total =
      results.published.length +
      results.updated.length +
      results.skipped.length +
      results.errors.length

    if (total === 0) {
      body = '**Dev.to Sync**: No articles to sync.'
    } else {
      body = '### Dev.to Sync Results\n\n'
      body += '| Status | Count |\n'
      body += '|--------|-------|\n'
      body += `| Published | ${results.published.length} |\n`
      body += `| Updated | ${results.updated.length} |\n`
      body += `| Skipped | ${results.skipped.length} |\n`
      body += `| Errors | ${results.errors.length} |\n\n`

      const processed = [
        ...results.published.map((i) => ({ ...i, status: 'Published' })),
        ...results.updated.map((i) => ({ ...i, status: 'Updated' })),
      ]

      if (processed.length > 0) {
        body += '<details>\n'
        body += `<summary>View ${processed.length} synced article(s)</summary>\n\n`
        body += '| Status | File | Dev.to Link |\n'
        body += '|--------|------|-------------|\n'
        for (const item of processed) {
          body += `| ${item.status} | \`${item.file}\` | [View](${item.devToUrl}) |\n`
        }
        body += '\n</details>\n\n'
      }

      if (results.skipped.length > 0) {
        body += '<details>\n'
        body += `<summary>View ${results.skipped.length} skipped article(s)</summary>\n\n`
        for (const item of results.skipped) {
          body += `- \`${item.file}\`: ${item.reason}\n`
        }
        body += '\n</details>\n\n'
      }

      if (results.errors.length > 0) {
        body += '<details>\n'
        body += `<summary>View ${results.errors.length} error(s)</summary>\n\n`
        for (const item of results.errors) {
          body += `- \`${item.file}\`: ${item.error}\n`
        }
        body += '\n</details>\n'
      }
    }
  }

  await github.rest.issues.createComment({
    issue_number: context.issue.number,
    owner: context.repo.owner,
    repo: context.repo.repo,
    body,
  })
}
