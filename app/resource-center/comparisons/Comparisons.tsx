'use client'

import React, { useEffect, useState } from 'react'
import BlogPostCard from '../Shared/BlogPostCard'
import SearchInput from '../Shared/Search'
import { filterData } from 'app/utils/common'
import { Frown, Loader2 } from 'lucide-react'
import { fetchMDXContentByPath } from '@/utils/strapi'
import { calculateReadingTime } from '@/utils/content'

interface ComparisonsPageHeaderProps {
  onSearch: (e) => void
}

const ComparisonsPageHeader: React.FC<ComparisonsPageHeaderProps> = ({ onSearch }) => {
  return (
    <section className="mb-[72px] flex max-w-[697px] flex-col leading-[143%]">
      <h2 className="mb-0 self-start text-sm font-medium uppercase tracking-wider text-signoz_sakura-500 dark:text-signoz_sakura-400">
        resources
      </h2>
      <h1 className="my-0 mt-3 self-start text-3xl font-semibold text-indigo-500 dark:text-indigo-200">
        Comparisons
      </h1>
      <p className="my-4 w-full text-lg leading-8 tracking-normal text-gray-700 dark:text-stone-300 max-md:max-w-full">
        Stay informed about the latest tools in the observability domain with in-depth comparisons
        of popular options to determine the best fit for your needs.
      </p>

      <SearchInput placeholder={'Search for a blog...'} onSearch={onSearch} />
    </section>
  )
}

export default function ComparisonsListing() {
  const [posts, setPosts] = useState<any[]>([])
  const [blogs, setBlogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchValue, setSearchValue] = useState('')

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetchMDXContentByPath('comparisons', undefined, undefined, true)
        const data = 'data' in response ? response.data : [response]

        const mappedData = data.map((post) => ({
          ...post,
          date: post.publishedAt || post.date,
          path: post.path || `comparisons/${post.slug}`,
          readingTime: calculateReadingTime(post.content),
        }))

        // Sort by date desc
        mappedData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        setPosts(mappedData)
        setBlogs(mappedData)
      } catch (error) {
        console.error('Failed to fetch comparisons', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const primaryFeaturedBlogs = posts.slice(0, 2)

  const handleSearch = (e) => {
    setSearchValue(e.target.value)
    const filteredPosts = filterData(posts, e.target.value)
    setBlogs(filteredPosts)
  }

  if (loading) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    )
  }

  return (
    <div className="comparisons">
      <ComparisonsPageHeader onSearch={handleSearch} />

      {searchValue && searchValue.length == 0 && (
        <div className="mt-5 w-full max-md:max-w-full">
          <div className="mt-4 grid gap-4 sm:grid-cols-1 md:grid-cols-2">
            {primaryFeaturedBlogs.map((featuredBlog, index) => {
              return <BlogPostCard blog={featuredBlog as any} key={index} />
            })}
          </div>
        </div>
      )}

      {blogs && Array.isArray(blogs) && blogs.length <= 0 && (
        <div className="no-blogs my-8 flex items-center gap-4 font-mono font-bold">
          <Frown size={16} /> No Comparisons found
        </div>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {blogs.map((post, index) => {
          return <BlogPostCard blog={post as any} key={index} />
        })}
      </div>
    </div>
  )
}
