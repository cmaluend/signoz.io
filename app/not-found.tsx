import { allDocs } from 'contentlayer/generated'
import NotFoundRecovery, { type DocsIndexEntry } from '@/components/not-found/NotFoundRecovery'

const docsIndex: DocsIndexEntry[] = allDocs
  .filter((doc) => Boolean(doc.slug))
  .map((doc) => ({
    title: doc.title,
    slug: doc.slug,
  }))

export default function NotFound() {
  return <NotFoundRecovery docsIndex={docsIndex} />
}
