const fs = require('fs')
const path = require('path')
const matter = require('gray-matter')
const axios = require('axios')
const FormData = require('form-data')
const mime = require('mime-types')

// Configuration
const CMS_API_URL = process.env.CMS_API_URL
const CMS_API_TOKEN = process.env.CMS_API_TOKEN
const SYNC_FOLDERS = JSON.parse(process.env.SYNC_FOLDERS)
const DEPLOYMENT_STATUS = process.env.DEPLOYMENT_STATUS
const CHANGED_FILES = JSON.parse(process.env.CHANGED_FILES || '[]')
const DELETED_FILES = JSON.parse(process.env.DELETED_FILES || '[]')

// Strapi Collection Type Schemas
const COLLECTION_SCHEMAS = {
  faqs: {
    apiPath: 'api::faq.faq',
    endpoint: 'faqs',
    fields: ['title', 'description', 'date', 'path', 'content', 'deployment_status'],
    relations: {
      authors: {
        endpoint: 'authors',
        matchField: 'key', // Match against author.key
        frontmatterField: 'authors', // Array of author keys in frontmatter
      },
      tags: {
        endpoint: 'tags',
        matchField: 'key', // Match against tag.key
        frontmatterField: 'tags', // Array of tag values in frontmatter
        filterKey: true, // Also check if tag.key contains 'faq' or 'faqs'
        matchValue: true, // Match against tag.value (case insensitive)
      },
      related_faqs: {
        endpoint: 'faqs',
        matchField: 'path', // Match against faq.path
        frontmatterField: 'related_faqs', // Array of FAQ paths in frontmatter
      },
    },
  },
  'case-study': {
    apiPath: 'api::case-study.case-study',
    endpoint: 'case-studies',
    fields: ['title', 'description', 'image', 'path', 'content', 'deployment_status'],
    relations: {
      authors: {
        endpoint: 'authors',
        matchField: 'key', // Match against author.key
        frontmatterField: 'authors', // Array of author keys in frontmatter
      },
    },
  },
  comparisons: {
    apiPath: 'api::comparison.comparison',
    endpoint: 'comparisons',
    fields: ['title', 'description', 'image', 'path', 'content', 'deployment_status'],
    relations: {
      authors: {
        endpoint: 'authors',
        matchField: 'key', // Match against author.key
        frontmatterField: 'authors', // Array of author keys in frontmatter
      },
      tags: {
        endpoint: 'tags',
        matchField: 'key', // Match against tag.key
        frontmatterField: 'tags', // Array of tag values in frontmatter
        filterKey: true, // Also check if tag.key contains 'faq' or 'faqs'
        matchValue: true, // Match against tag.value (case insensitive)
      },
      related_comparisons: {
        endpoint: 'comparisons',
        matchField: 'path', // Match against comparison.path
        frontmatterField: 'related_comparisons', // Array of comparison paths in frontmatter
      },
      keywords: {
        endpoint: 'keywords',
        matchField: 'key', // Match against keyword.key
        frontmatterField: 'keywords', // Array of keyword values in frontmatter
        filterKey: true, // Also check if keyword.key contains 'comparison' or 'comparisons'
        matchValue: true, // Match against keyword.value (case insensitive)
      },
    },
  },
  guides: {
    apiPath: 'api::guide.guide',
    endpoint: 'guides',
    fields: ['title', 'description', 'image', 'path', 'content', 'deployment_status', 'date'],
    relations: {
      authors: {
        endpoint: 'authors',
        matchField: 'key', // Match against author.key
        frontmatterField: 'authors', // Array of author keys in frontmatter
      },
      keywords: {
        endpoint: 'keywords',
        matchField: 'key', // Match against keyword.key
        frontmatterField: 'keywords', // Array of keyword values in frontmatter
        filterKey: true, // Also check if keyword.key contains 'comparison' or 'comparisons'
        matchValue: true, // Match against keyword.value (case insensitive)
      },
      tags: {
        endpoint: 'tags',
        matchField: 'key', // Match against tag.key
        frontmatterField: 'tags', // Array of tag values in frontmatter
        filterKey: true, // Also check if tag.key contains 'faq' or 'faqs'
        matchValue: true, // Match against tag.value (case insensitive)
      },
      related_guides: {
        endpoint: 'guides',
        matchField: 'path', // Match against guide.path
        frontmatterField: 'related_guides', // Array of guide paths in frontmatter
      },
    },
  },
  authors: {
    apiPath: 'api::author.author',
    endpoint: 'authors',
    fields: ['key', 'name', 'title', 'url', 'image_url'],
  },
  tags: {
    apiPath: 'api::tag.tag',
    endpoint: 'tags',
    fields: ['value', 'key', 'description'],
  },
  keywords: {
    apiPath: 'api::keyword.keyword',
    endpoint: 'keywords',
    fields: ['value', 'key', 'description'],
  },
}

// Helper: Extract folder name from file path
function getFolderName(filePath) {
  const parts = filePath.split('/')
  if (parts[0] === 'data' && parts.length > 1) {
    return parts[1]
  }
  return null
}

// Helper: Generate path field from file path
function generatePathField(filePath, folderName) {
  const parts = filePath.split('/')
  const folderIndex = parts.indexOf(folderName)
  if (folderIndex === -1) return null

  const pathParts = parts.slice(folderIndex + 1)
  const fileName = pathParts[pathParts.length - 1]
  const fileNameWithoutExt = fileName.replace(/\.(mdx?|md)$/, '')

  pathParts[pathParts.length - 1] = fileNameWithoutExt
  return '/' + pathParts.join('/')
}

// Helper: Parse MDX file
function parseMDXFile(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8')
    const { data: frontmatter, content } = matter(fileContent)
    return { frontmatter, content }
  } catch (error) {
    throw new Error(`Failed to parse file ${filePath}: ${error.message}`)
  }
}

// Helper: Fetch all entities from Strapi endpoint
async function fetchAllEntities(endpoint) {
  try {
    const response = await axios.get(`${CMS_API_URL}/api/${endpoint}`, {
      params: {
        pagination: { pageSize: 100 }, // Adjust if you have more
      },
      headers: {
        Authorization: `Bearer ${CMS_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    })

    return response.data.data || []
  } catch (error) {
    console.error(`Failed to fetch ${endpoint}: ${error.message}`)
    return []
  }
}

// ASSET MANAGEMENT

// Helper: Get or Create Folder in Strapi
async function getOrCreateStrapiFolder(folderPath) {
  // folderPath example: "img/blog/2023" (relative to public)
  const parts = folderPath.split('/').filter((p) => p)
  let parentId = null

  for (const part of parts) {
    try {
      // Search for folder with this name and parent
      const params = {
        filters: {
          name: { $eq: part },
          parent: { id: parentId ? { $eq: parentId } : { $null: true } },
        },
      }

      const response = await axios.get(`${CMS_API_URL}/api/upload/folders`, {
        params,
        headers: { Authorization: `Bearer ${CMS_API_TOKEN}` },
      })

      const folders = response.data.data
      if (folders && folders.length > 0) {
        parentId = folders[0].id
        console.log(`    📂 Found folder "${part}" (ID: ${parentId})`)
      } else {
        // Create folder
        console.log(`    📂 Creating folder "${part}" under parent ${parentId}...`)
        const createRes = await axios.post(
          `${CMS_API_URL}/api/upload/folders`,
          { name: part, parent: parentId },
          { headers: { Authorization: `Bearer ${CMS_API_TOKEN}` } }
        )
        parentId = createRes.data.data.id
        console.log(`    ✅ Created folder "${part}" (ID: ${parentId})`)
      }
    } catch (error) {
      console.error(`    ❌ Error handling folder "${part}": ${error.message}`)
      throw error
    }
  }
  return parentId
}

// Helper: Find asset by name and folder
async function findAssetInStrapi(filename, folderId) {
  try {
    const params = {
      filters: {
        name: { $eq: filename },
        folder: { id: folderId ? { $eq: folderId } : { $null: true } },
      },
    }
    const response = await axios.get(`${CMS_API_URL}/api/upload/files`, {
      params,
      headers: { Authorization: `Bearer ${CMS_API_TOKEN}` },
    })

    if (response.data && response.data.length > 0) {
      return response.data[0]
    }
    return null
  } catch (error) {
    console.error(`    ❌ Error finding asset: ${error.message}`)
    return null
  }
}

// Helper: Upload asset to Strapi
async function uploadAssetToStrapi(filePath, folderId, existingId = null) {
  try {
    const fileName = path.basename(filePath)
    const stats = fs.statSync(filePath)
    const fileSizeInBytes = stats.size
    const fileStream = fs.createReadStream(filePath)
    const mimeType = mime.lookup(filePath) || 'application/octet-stream'

    const formData = new FormData()
    formData.append('files', fileStream, {
      filepath: filePath,
      contentType: mimeType,
      knownLength: fileSizeInBytes,
    })

    // Add file info
    const fileInfo = {
      name: fileName,
      folder: folderId,
    }
    if (existingId) {
      // Strapi doesn't support "update file content" easily via simple upload endpoint
      // So we delete and re-upload
      // For safety and simplicity in V4, we'll delete the old one and upload new one,
      // this means the ID will change.
      // we replace URLs in content, so changing ID/URL is acceptable as long as we update the content references
      console.log(`    🔄 Re-uploading (delete old + upload new) for ${fileName}`)
      await deleteAssetFromStrapi(existingId)
    }

    formData.append('fileInfo', JSON.stringify(fileInfo))

    const response = await axios.post(`${CMS_API_URL}/api/upload`, formData, {
      headers: {
        Authorization: `Bearer ${CMS_API_TOKEN}`,
        ...formData.getHeaders(),
      },
    })

    return response.data[0] // Returns array of uploaded files
  } catch (error) {
    console.error(`    ❌ Upload failed for ${filePath}: ${error.message}`)
    if (error.response) {
      console.error(`      Response: ${JSON.stringify(error.response.data)}`)
    }
    throw error
  }
}

// Helper: Delete asset from Strapi
async function deleteAssetFromStrapi(fileId) {
  try {
    await axios.delete(`${CMS_API_URL}/api/upload/files/${fileId}`, {
      headers: { Authorization: `Bearer ${CMS_API_TOKEN}` },
    })
    console.log(`    🗑️ Deleted asset ID ${fileId}`)
  } catch (error) {
    console.warn(`    ⚠️ Failed to delete asset ID ${fileId}: ${error.message}`)
  }
}

// Main Asset Sync Function
async function syncAsset(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Asset file not found locally: ${filePath}`)
  }

  // Calculate relative path from 'public' to determine folder structure
  // filePath is like "public/img/blog/foo.png"
  const relPath = path.relative('public', filePath) // "img/blog/foo.png"
  const dirName = path.dirname(relPath) // "img/blog"
  const fileName = path.basename(filePath)

  console.log(`  🖼️ Syncing asset: ${relPath}`)

  // 1. folder structure
  let folderId = null
  if (dirName !== '.') {
    folderId = await getOrCreateStrapiFolder(dirName)
  }

  // 2. Check if exists
  const existingAsset = await findAssetInStrapi(fileName, folderId)

  // 3. Upload or Update
  if (existingAsset) {
    console.log(`    ✅ Found existing asset ID: ${existingAsset.id}`)

    const isChanged = CHANGED_FILES.includes(filePath)
    if (isChanged) {
      console.log(`    🔄 File changed in git, updating in CMS...`)
      const newAsset = await uploadAssetToStrapi(filePath, folderId, existingAsset.id)
      return newAsset
    }
    return existingAsset
  } else {
    console.log(`    ➕ Asset not found in CMS, uploading...`)
    const newAsset = await uploadAssetToStrapi(filePath, folderId)
    return newAsset
  }
}

// Helper: Replace local paths with Strapi URLs in content/frontmatter
async function processContentAssets(content, frontmatter) {
  let newContent = content
  let newFrontmatter = { ...frontmatter }

  // Regex to find potential asset paths
  // Matches: /img/..., /videos/..., etc. (assuming they start with / and are in public)
  // We look for common patterns in MDX: ](/path), src="/path", src='/path', "image": "/path"
  const assetPathRegex = /(\/img\/[^\s"')]+|\/videos\/[^\s"')]+|\/files\/[^\s"')]+)/g

  const matches = new Set()

  // Scan content
  let match
  while ((match = assetPathRegex.exec(content)) !== null) {
    matches.add(match[1])
  }

  // Scan frontmatter (values only)
  Object.values(frontmatter).forEach((val) => {
    if (typeof val === 'string' && (val.startsWith('/img/') || val.startsWith('/videos/'))) {
      matches.add(val)
    }
  })

  if (matches.size === 0) return { content, frontmatter }

  console.log(`  🔍 Found ${matches.size} asset references. Resolving...`)

  for (const assetPath of matches) {
    // assetPath is like "/img/blog/foo.png"
    // local path is "public/img/blog/foo.png"
    const localPath = path.join('public', assetPath)

    if (fs.existsSync(localPath)) {
      try {
        const asset = await syncAsset(localPath)
        if (asset && asset.url) {
          const strapiUrl = asset.url // Should be full URL if provider is cloud, or relative if local
          // If relative, prepend CMS_API_URL
          const fullUrl = strapiUrl.startsWith('http') ? strapiUrl : `${CMS_API_URL}${strapiUrl}`

          console.log(`    🔗 Replacing ${assetPath} -> ${fullUrl}`)

          // Replace in content
          // Escape special regex chars in assetPath for replacement
          const escapedPath = assetPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          const replaceRegex = new RegExp(escapedPath, 'g')

          console.log(`    🔗 Initial content: ${newContent}`)
          console.log(`    🔗 Replace regex: ${replaceRegex}`)
          console.log(`    🔗 Replace with: ${fullUrl}`)

          newContent = newContent.replace(replaceRegex, fullUrl)

          console.log(`    🔗 Final content: ${newContent}`)

          // Replace in frontmatter
          Object.keys(newFrontmatter).forEach((key) => {
            if (newFrontmatter[key] === assetPath) {
              newFrontmatter[key] = fullUrl
            }
          })

          console.log(`    🔗 Replaced ${assetPath} -> ${fullUrl}`)
        }
      } catch (err) {
        console.error(`    ⚠️ Failed to sync asset ${assetPath}: ${err.message}`)
      }
    } else {
      console.warn(`    ⚠️ Referenced asset not found locally: ${localPath}`)
    }
  }

  return { content: newContent, frontmatter: newFrontmatter }
}

// CONTENT MANAGEMENT

// Helper: Create a tag or keyword entry
async function createTagOrKeyword(endpoint, value, folderName) {
  try {
    // Generate key by appending folder name to the value (lowercase, hyphenated)
    const key = `${folderName}-${value}`

    const data = {
      key: key,
      value: value,
      // description is optional, so we don't include it
    }

    console.log(`    🆕 Creating new ${endpoint} entry:`)
    console.log(`       • key: "${key}"`)
    console.log(`       • value: "${value}"`)

    const response = await axios.post(
      `${CMS_API_URL}/api/${endpoint}`,
      { data },
      {
        headers: {
          Authorization: `Bearer ${CMS_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    )

    console.log(
      `    ✅ Successfully created ${endpoint} entry with documentId: ${response.data.data.documentId}`
    )
    return response.data.data
  } catch (error) {
    const errorMsg = error.response?.data?.error?.message || error.message
    console.error(`    ❌ Failed to create ${endpoint} entry: ${errorMsg}`)
    throw error
  }
}

// Helper: Resolve relation IDs
async function resolveRelations(folderName, frontmatter) {
  const schema = COLLECTION_SCHEMAS[folderName]
  if (!schema.relations) return { relations: {}, warnings: [] }

  const relations = {}
  const warnings = []

  for (const [relationName, relationConfig] of Object.entries(schema.relations)) {
    const frontmatterValues = frontmatter[relationConfig.frontmatterField]

    // Skip if no values in frontmatter
    if (!frontmatterValues || !Array.isArray(frontmatterValues) || frontmatterValues.length === 0) {
      console.log(`  ⏭️ Skipping ${relationName}: No values in frontmatter`)
      continue
    }

    console.log(`  🔗 Resolving ${relationName}: ${frontmatterValues.join(', ')}`)

    // Check if this is tags or keywords relation
    const isTagsOrKeywords = relationName === 'tags' || relationName === 'keywords'

    // Fetch all entities from the relation endpoint
    let entities = await fetchAllEntities(relationConfig.endpoint)

    if (entities.length === 0 && !isTagsOrKeywords) {
      console.warn(`  ⚠️ No entities found in ${relationConfig.endpoint}`)
      continue
    }

    // Match entities based on configuration
    const matchedIds = []
    const unmatchedValues = []

    for (const value of frontmatterValues) {
      let matched = null

      if (relationConfig.filterKey && relationConfig.matchValue) {
        // Special case for tags: check key contains 'faq'/'faqs' AND value matches
        matched = entities.find((entity) => {
          const keyMatch =
            entity?.key && entity?.key.toLowerCase().includes(folderName.toLowerCase())

          const valueMatch = entity?.value && entity?.value.toLowerCase() === value.toLowerCase()

          return keyMatch && valueMatch
        })
      } else if (relationConfig.matchValue) {
        // Match against value field (case insensitive)
        matched = entities.find(
          (entity) => entity?.value && entity?.value.toLowerCase() === value.toLowerCase()
        )
      } else {
        // Match against specified field (exact match)
        matched = entities.find((entity) => entity?.[relationConfig.matchField] === value)
      }

      // Check if matched and has documentId
      if (matched && matched?.documentId) {
        matchedIds.push(matched.documentId)
        console.log(`    ✅ Matched "${value}" → ID: ${matched.documentId}`)
      } else if (matched && !matched?.documentId) {
        // Matched entity but no documentId
        unmatchedValues.push(value)
        console.warn(
          `    ⚠️ Entity found for "${value}" but no documentId in ${relationConfig.endpoint}`
        )
      } else {
        // No match found
        console.warn(`    ⚠️ No match found for "${value}" in ${relationConfig.endpoint}`)

        // Auto-create tags or keywords if not found
        if (isTagsOrKeywords) {
          try {
            console.log(`    🔧 Auto-creating missing ${relationName} entry for: "${value}"`)
            const newEntry = await createTagOrKeyword(relationConfig.endpoint, value, folderName)

            if (newEntry && newEntry.documentId) {
              matchedIds.push(newEntry.documentId)
              // Add to entities array so it's available for subsequent matches
              entities.push(newEntry)
              console.log(`    ✅ Auto-created and matched "${value}" → ID: ${newEntry.documentId}`)
            } else {
              unmatchedValues.push(value)
              console.error(`    ❌ Created entry but no documentId returned for "${value}"`)
            }
          } catch (createError) {
            unmatchedValues.push(value)
            console.error(
              `    ❌ Failed to auto-create ${relationName} for "${value}": ${createError.message}`
            )
          }
        } else {
          unmatchedValues.push(value)
        }
      }
    }

    // Log unmatched values for this field
    if (unmatchedValues.length > 0) {
      console.warn(
        `  ⚠️ ${relationName}: ${unmatchedValues.length} unmatched value(s): ${unmatchedValues.join(', ')}`
      )
      warnings.push({
        relationName,
        unmatchedValues,
      })
    }

    // Only add relation if at least one valid documentId was found
    if (matchedIds.length > 0) {
      relations[relationName] = matchedIds
      console.log(`  ✅ ${relationName}: Resolved ${matchedIds.length} relation(s)`)
    } else {
      console.warn(`  ⚠️ ${relationName}: No valid relations found, key will be omitted`)
    }
  }

  return { relations, warnings }
}

// Helper: Map MDX data to Strapi schema
async function mapToStrapiSchema(folderName, frontmatter, content, pathField) {
  const schema = COLLECTION_SCHEMAS[folderName]
  if (!schema) {
    throw new Error(`No schema defined for folder: ${folderName}`)
  }

  // 1. Process Assets in Content and Frontmatter
  // This will upload referenced assets and replace paths with CMS URLs
  const { content: processedContent, frontmatter: processedFrontmatter } =
    await processContentAssets(content, frontmatter)

  // Base data
  const data = {
    path: pathField,
    content: processedContent,
    deployment_status: DEPLOYMENT_STATUS,
    ...processedFrontmatter,
  }

  // Resolve relations
  console.log(`  🔍 Resolving relations...`)
  const { relations, warnings } = await resolveRelations(folderName, processedFrontmatter)

  // Remove raw frontmatter relation fields
  if (schema.relations) {
    console.log(`  🧹 [DEBUG] Cleaning up relation fields from frontmatter...`)
    for (const [relationName, relationConfig] of Object.entries(schema.relations)) {
      const fieldName = relationConfig.frontmatterField
      if (data[fieldName]) {
        delete data[fieldName]
      }
    }
  }

  if (Object.keys(relations).length > 0) {
    Object.assign(data, relations)
  }

  // Check for missing required fields
  const missingFields = schema.fields.filter(
    (field) => field !== 'deployment_status' && !(field in data)
  )

  if (missingFields.length > 0) {
    console.warn(`  ⚠️ Missing fields: ${missingFields.join(', ')}`)
  }

  return { data, warnings }
}

// Helper: Check if file exists in Strapi by path
async function findEntryByPath(folderName, pathField) {
  const schema = COLLECTION_SCHEMAS[folderName]
  try {
    const response = await axios.get(`${CMS_API_URL}/api/${schema.endpoint}`, {
      params: {
        filters: { path: { $eq: pathField }, deployment_status: { $eq: DEPLOYMENT_STATUS } },
        pagination: { limit: 1 },
      },
      headers: {
        Authorization: `Bearer ${CMS_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    })

    if (response.data.data && response.data.data.length > 0) {
      return response.data.data[0]
    }
    return null
  } catch (error) {
    console.error(`  ❌ [DEBUG] Error in findEntryByPath:`, error.message)
    throw new Error(`Failed to find entry by path: ${error.message}`)
  }
}

// Helper: Create entry in Strapi
async function createEntry(folderName, data) {
  const schema = COLLECTION_SCHEMAS[folderName]
  try {
    const response = await axios.post(
      `${CMS_API_URL}/api/${schema.endpoint}`,
      { data },
      {
        headers: {
          Authorization: `Bearer ${CMS_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    )
    return response.data
  } catch (error) {
    const errorMsg = error.response?.data?.error?.message || error.message
    console.error(`  ❌ [DEBUG] Create failed: ${errorMsg}`)
    throw error
  }
}

// Helper: Update entry in Strapi
async function updateEntry(folderName, documentId, data) {
  const schema = COLLECTION_SCHEMAS[folderName]
  try {
    const response = await axios.put(
      `${CMS_API_URL}/api/${schema.endpoint}/${documentId}`,
      { data },
      {
        headers: {
          Authorization: `Bearer ${CMS_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    )
    return response.data
  } catch (error) {
    const errorMsg = error.response?.data?.error?.message || error.message
    console.error(`  ❌ [DEBUG] Update failed: ${errorMsg}`)
    throw error
  }
}

// Helper: Delete entry in Strapi
async function deleteEntry(folderName, documentId) {
  const schema = COLLECTION_SCHEMAS[folderName]
  try {
    const response = await axios.delete(`${CMS_API_URL}/api/${schema.endpoint}/${documentId}`, {
      headers: {
        Authorization: `Bearer ${CMS_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    })
    return response.data
  } catch (error) {
    const errorMsg = error.response?.data?.error?.message || error.message
    console.error(`  ❌ [DEBUG] Delete failed: ${errorMsg}`)
    throw new Error(`Failed to delete entry: ${errorMsg}`)
  }
}

// Helper: Detect operation type
function detectOperationType(filePath, isDeletedFile = false) {
  if (isDeletedFile) return 'delete'

  if (!fs.existsSync(filePath)) return 'delete'

  return 'create_or_update'
}

// Main sync logic
async function syncToStrapi() {
  console.log('🚀 Starting sync to Strapi CMS...\n')
  console.log(`📦 Deployment Status: ${DEPLOYMENT_STATUS}`)
  console.log(`🔗 CMS API URL: ${CMS_API_URL}`)
  console.log(`📁 Sync Folders: ${SYNC_FOLDERS.join(', ')}`)
  console.log(`\n📄 Changed Files (${CHANGED_FILES.length}):`)
  CHANGED_FILES.forEach((file, idx) => console.log(`   ${idx + 1}. ${file}`))
  console.log(`\n🗑️ Deleted Files (${DELETED_FILES.length}):`)
  DELETED_FILES.forEach((file, idx) => console.log(`   ${idx + 1}. ${file}`))
  console.log('')

  const results = {
    created: [],
    updated: [],
    deleted: [],
    skipped: [],
    errors: [],
    relationWarnings: [],
    assets: { synced: [], deleted: [], errors: [] },
  }

  // Combine changed and deleted files with a flag
  const allFiles = [
    ...CHANGED_FILES.map((file) => ({ path: file, isDeleted: false })),
    ...DELETED_FILES.map((file) => ({ path: file, isDeleted: true })),
  ]

  for (const { path: filePath, isDeleted } of allFiles) {
    console.log(`\n${'='.repeat(80)}`)
    console.log(`📄 Processing: ${filePath}`)

    // Check if it's an asset (in public folder)
    if (filePath.startsWith('public/')) {
      console.log(`  🖼️ Detected asset file`)
      try {
        if (isDeleted) {
          const fileName = path.basename(filePath)
          const relPath = path.relative('public', filePath)
          const dirName = path.dirname(relPath)

          // Try to find folder ID to narrow down deletion
          let folderId = null
          if (dirName !== '.') {
            // This might fail if the folder itself was deleted locally,
            // but in Strapi it might still exist or we search without folder if strict check fails.
            // For safety, we search by name and path structure if possible.
            // If we can't find folder, we might risk deleting wrong file if names are duplicate.
            // best effort only.
            try {
              folderId = await getOrCreateStrapiFolder(dirName)
            } catch (e) {}
          }

          const asset = await findAssetInStrapi(fileName, folderId)
          if (asset) {
            await deleteAssetFromStrapi(asset.id)
            results.assets.deleted.push(filePath)
          } else {
            console.log(`  ℹ️ Asset not found in CMS, nothing to delete.`)
          }
        } else {
          // Sync asset (create/update)
          await syncAsset(filePath)
          results.assets.synced.push(filePath)
        }
      } catch (error) {
        console.error(`  ❌ Error syncing asset ${filePath}: ${error.message}`)
        results.assets.errors.push({ file: filePath, error: error.message })
      }
      continue
    }

    try {
      const folderName = getFolderName(filePath)

      if (!folderName || !SYNC_FOLDERS.includes(folderName)) {
        console.log(`⏭️ Skipped: Folder '${folderName}' not in sync list`)
        results.skipped.push(filePath)
        continue
      }

      const pathField = generatePathField(filePath, folderName)
      if (!pathField) {
        throw new Error('Could not generate path field')
      }

      const operationType = detectOperationType(filePath, isDeleted)

      if (operationType === 'delete') {
        console.log(`🗑️ Deleting from CMS: ${pathField}`)
        const existingEntry = await findEntryByPath(folderName, pathField)

        if (existingEntry) {
          await deleteEntry(folderName, existingEntry.documentId)
          console.log(`✅ Deleted successfully`)
          results.deleted.push({ file: filePath, path: pathField })
        } else {
          console.log(`⚠️ Entry not found in CMS, skipping deletion`)
          results.skipped.push(filePath)
        }
      } else {
        console.log(`  📖 [DEBUG] Parsing MDX file...`)
        const { frontmatter, content } = parseMDXFile(filePath)
        console.log(`  📖 [DEBUG] Frontmatter keys:`, Object.keys(frontmatter).join(', '))

        console.log(`  🗺️ [DEBUG] Mapping to Strapi schema...`)
        const { data: strapiData, warnings } = await mapToStrapiSchema(
          folderName,
          frontmatter,
          content,
          pathField
        )
        console.log(`  🗺️ [DEBUG] Mapped data keys:`, Object.keys(strapiData).join(', '))

        // Track relation warnings
        if (warnings && warnings.length > 0) {
          results.relationWarnings.push({
            file: filePath,
            path: pathField,
            warnings,
          })
        }

        console.log(`  🔎 Checking if entry exists in CMS...`)
        const existingEntry = await findEntryByPath(folderName, pathField)

        if (existingEntry) {
          console.log(`🔄 Updating in CMS: ${pathField}`)
          if (!existingEntry.documentId) {
            throw new Error(`Entry found but has no documentId`)
          }
          await updateEntry(folderName, existingEntry.documentId, strapiData)
          console.log(`✅ Updated successfully`)
          results.updated.push({ file: filePath, path: pathField })
        } else {
          console.log(`➕ Creating in CMS: ${pathField}`)
          await createEntry(folderName, strapiData)
          console.log(`✅ Created successfully`)
          results.created.push({ file: filePath, path: pathField })
        }
      }
    } catch (error) {
      console.error(`\n❌ [DEBUG] ============ ERROR DETAILS ============`)
      console.error(`❌ [DEBUG] File: ${filePath}`)
      console.error(`❌ [DEBUG] Error message: ${error.message}`)
      console.error(`❌ [DEBUG] Error name: ${error.name}`)
      console.error(`❌ [DEBUG] Error stack:`, error.stack)

      if (error.response) {
        console.error(`❌ [DEBUG] HTTP Response status: ${error.response.status}`)
        console.error(
          `❌ [DEBUG] HTTP Response headers:`,
          JSON.stringify(error.response.headers, null, 2)
        )
        console.error(
          `❌ [DEBUG] HTTP Response data:`,
          JSON.stringify(error.response.data, null, 2)
        )
      }

      if (error.config) {
        console.error(`❌ [DEBUG] Request config:`)
        console.error(`  - URL: ${error.config.url}`)
        console.error(`  - Method: ${error.config.method}`)
        console.error(`  - Data: ${error.config.data}`)
      }

      console.error(`❌ [DEBUG] =========================================\n`)

      console.error(`❌ Error processing ${filePath}: ${error.message}`)
      // Log full stack for debugging
      console.error(error.stack)
      results.errors.push({ file: filePath, error: error.message })
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 SYNC SUMMARY')
  console.log('='.repeat(60))
  console.log(`✅ Content Created: ${results.created.length}`)
  console.log(`🔄 Content Updated: ${results.updated.length}`)
  console.log(`🗑️ Content Deleted: ${results.deleted.length}`)
  console.log(`🖼️ Assets Synced:  ${results.assets.synced.length}`)
  console.log(`🗑️ Assets Deleted: ${results.assets.deleted.length}`)
  console.log(`❌ Assets Errors:  ${results.assets.errors.length}`)
  console.log(`⏭️ Skipped: ${results.skipped.length}`)
  console.log(`❌ Errors: ${results.errors.length}`)
  console.log(`⚠️ Relation Warnings: ${results.relationWarnings.length}`)
  console.log('='.repeat(60) + '\n')

  if (results.errors.length > 0) {
    console.error('\n❌ SYNC FAILED - The following errors occurred:\n')
    results.errors.forEach(({ file, error }) => {
      console.error(`  • ${file}: ${error}`)
    })

    // Extract relation types even on error for PR comment
    const usedSchemas = new Set()
    const allRelationNames = new Set()

    ;[...results.created, ...results.updated].forEach((item) => {
      const folderName = getFolderName(item.file)
      if (folderName && COLLECTION_SCHEMAS[folderName]) {
        usedSchemas.add(folderName)
        const schema = COLLECTION_SCHEMAS[folderName]
        if (schema.relations) {
          Object.keys(schema.relations).forEach((relationName) => {
            allRelationNames.add(relationName)
          })
        }
      }
    })

    results.relationTypes = Array.from(allRelationNames)
    results.deploymentStatus = DEPLOYMENT_STATUS

    // Save results to file even on error for PR comment
    try {
      fs.writeFileSync('sync-results.json', JSON.stringify(results, null, 2))
      console.log('📝 Results saved to sync-results.json')
    } catch (writeError) {
      console.error('Failed to save results:', writeError.message)
    }

    process.exit(1)
  }

  // Extract all unique relation names from schemas used
  const usedSchemas = new Set()
  const allRelationNames = new Set()

  // Get schemas from processed files
  ;[...results.created, ...results.updated].forEach((item) => {
    const folderName = getFolderName(item.file)
    if (folderName && COLLECTION_SCHEMAS[folderName]) {
      usedSchemas.add(folderName)
      const schema = COLLECTION_SCHEMAS[folderName]
      if (schema.relations) {
        Object.keys(schema.relations).forEach((relationName) => {
          allRelationNames.add(relationName)
        })
      }
    }
  })

  // Add relation info to results
  results.relationTypes = Array.from(allRelationNames)
  results.deploymentStatus = DEPLOYMENT_STATUS

  // Save results to file for PR comment script
  try {
    fs.writeFileSync('sync-results.json', JSON.stringify(results, null, 2))
    console.log('📝 Results saved to sync-results.json')
  } catch (writeError) {
    console.error('Failed to save results:', writeError.message)
  }

  return results
}

// Validate environment variables
if (!CMS_API_URL || !CMS_API_TOKEN) {
  console.error('❌ ERROR: Missing required environment variables')
  console.error('   Required: CMS_API_URL, CMS_API_TOKEN')
  process.exit(1)
}

// Run sync
syncToStrapi()
  .then(() => {
    console.log('✅ Sync completed successfully!')
  })
  .catch((error) => {
    console.error('❌ SYNC FAILED:', error.message)
    process.exit(1)
  })
