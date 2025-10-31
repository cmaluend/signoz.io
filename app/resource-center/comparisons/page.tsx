import React from 'react'
import Comparisons from './Comparisons'

export const revalidate = 0
export const dynamicParams = true

export default async function ComparisonsHome() {
  return (
    <div className="container mx-auto !mt-[48px] py-16 sm:py-8">
      <div className="tab-content pt-6">
        <Comparisons />
      </div>
    </div>
  )
}
