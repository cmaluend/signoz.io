import { headers } from 'next/headers'
import NotFoundRecovery from '@/components/not-found/NotFoundRecovery'
import { getNotFoundSuggestions, hasAlgoliaConfig } from '@/components/not-found/suggestions'

export default async function NotFound() {
  const requestHeaders = headers()
  const pathname = requestHeaders.get('x-pathname') || '/'
  const suggestions = await getNotFoundSuggestions(pathname, 3)
  const suggestionIntro = hasAlgoliaConfig()
    ? 'You might be looking for:'
    : 'Popular docs to get started:'

  return (
    <NotFoundRecovery
      pathname={pathname}
      suggestions={suggestions}
      suggestionIntro={suggestionIntro}
    />
  )
}
