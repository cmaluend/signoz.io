import React from 'react'
import Blogs from './Blogs'

export default async function BlogHome() {
  return (
    <div className="container mx-auto !mt-[48px] py-16 sm:py-8">
      <div className="tab-content pt-6">
        <Blogs />
      </div>
    </div>
  )
}
