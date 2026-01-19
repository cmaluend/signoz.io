'use client'

import React from 'react'
import { SiPhp, SiLaravel, SiWordpress } from 'react-icons/si'
import { FaCode } from 'react-icons/fa'
import IconCardGrid from '../Card/IconCardGrid'

export default function PHPInstrumentationListicle() {
  return (
    <div>
      <div className="mb-10">
        <h2 className="mb-4 text-2xl font-semibold">PHP Frameworks</h2>
        <IconCardGrid
          cards={[
            {
              name: 'PHP',
              href: '/docs/instrumentation/php/opentelemetry-php',
              icon: <SiPhp className="h-7 w-7 text-indigo-500" />,
              clickName: 'PHP Instrumentation Link',
            },
            {
              name: 'Laravel',
              href: '/docs/instrumentation/php/opentelemetry-laravel',
              icon: <SiLaravel className="h-7 w-7 text-red-500" />,
              clickName: 'Laravel Instrumentation Link',
            },
            {
              name: 'WordPress',
              href: '/docs/instrumentation/php/opentelemetry-wordpress',
              icon: <SiWordpress className="h-7 w-7 text-blue-500" />,
              clickName: 'WordPress Instrumentation Link',
            },
          ]}
          sectionName="PHP Frameworks Section"
          gridCols="grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
        />
      </div>

      <div className="mb-10">
        <h2 className="mb-4 text-2xl font-semibold">Advanced</h2>
        <IconCardGrid
          cards={[
            {
              name: 'Manual Instrumentation',
              href: '/docs/instrumentation/php/manual-instrumentation',
              icon: <FaCode className="h-7 w-7 text-orange-500" />,
              clickName: 'PHP Manual Instrumentation Link',
            },
          ]}
          sectionName="PHP Advanced Section"
          gridCols="grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
        />
      </div>
    </div>
  )
}
