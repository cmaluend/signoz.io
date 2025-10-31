import { fetchMDXContentByPath, MDXContentApiResponse } from '@/utils/strapi'
import { notFound } from 'next/navigation'
import FAQsClient from './FAQsClient'

export const revalidate = 0
export const dynamicParams = true

export default async function FAQsPage() {
  try {
    // Fetch all FAQs from Strapi
    const response = (await fetchMDXContentByPath(
      'faqs',
      undefined,
      'live',
      true
    )) as MDXContentApiResponse

    if (!response || !response.data) {
      console.error('Invalid response from Strapi')
      notFound()
    }

    // Transform the data to match the client component's expected format
    const faqs = response.data.map((faq) => ({
      title: faq.attributes.title,
      description: faq.attributes.description,
      path: faq.attributes.path,
      date: faq.attributes.date,
      tags: faq.attributes.tags?.data?.map((tag) => tag.attributes.name) || [],
      draft: faq.attributes.deployment_status === 'draft',
    }))

    // Sort by date (since API sorts but we want to ensure client side too)
    const sortedFaqs = faqs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return <FAQsClient faqs={sortedFaqs} />
  } catch (error) {
    console.error('Error fetching FAQs:', error)
    notFound()
  }
}
