import React from 'react'
import Guides from './Guides'

export const revalidate = 0
export const dynamicParams = true

export default async function GuidesHome() {
  return (
    <div className="container mx-auto !mt-[48px] py-16 sm:py-8">
      <div className="tab-content pt-6">
        <Guides />
      </div>
    </div>
  )
}
