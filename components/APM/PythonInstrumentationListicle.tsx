'use client'

import React, { useState } from 'react'
import { SiPython, SiDjango, SiFlask, SiFastapi, SiCelery } from 'react-icons/si'
import { LuBird, LuWrench } from 'react-icons/lu'
import IconCardGrid from '../Card/IconCardGrid'

type SectionId = 'all' | 'frameworks' | 'workers' | 'advanced'

interface PythonInstrumentationListicleProps {
  category?: SectionId
}

export default function PythonInstrumentationListicle({
  category = 'all',
}: PythonInstrumentationListicleProps) {
  const sections: { id: SectionId; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'frameworks', label: 'Web Frameworks' },
    { id: 'workers', label: 'Background Workers' },
    { id: 'advanced', label: 'Manual & Advanced' },
  ]

  const [activeSection, setActiveSection] = useState<SectionId>(
    category === 'all' ? 'all' : category
  )

  const NavigationPills = () => (
    <div className="mb-8 flex flex-wrap gap-2">
      {sections.map((section) => (
        <button
          key={section.id}
          onClick={() => setActiveSection(section.id)}
          aria-current={activeSection === section.id ? 'true' : undefined}
          aria-label={`View ${section.label} instrumentation`}
          className={`inline-block rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            activeSection === section.id
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          {section.label}
        </button>
      ))}
    </div>
  )

  const renderFrameworksSection = () => (
    <div className="mb-10">
      <h2 className="mb-4 text-2xl font-semibold">Web Frameworks</h2>
      <IconCardGrid
        cards={[
          {
            name: 'Python (Generic)',
            href: '/docs/instrumentation/opentelemetry-python/python',
            icon: <SiPython className="h-7 w-7 text-blue-500" />,
            clickName: 'Python Instrumentation Link',
          },
          {
            name: 'Django',
            href: '/docs/instrumentation/opentelemetry-python/django',
            icon: <SiDjango className="h-7 w-7 text-green-800" />,
            clickName: 'Django Instrumentation Link',
          },
          {
            name: 'Flask',
            href: '/docs/instrumentation/opentelemetry-python/flask',
            icon: <SiFlask className="h-7 w-7 rounded-full bg-white text-black" />,
            clickName: 'Flask Instrumentation Link',
          },
          {
            name: 'FastAPI',
            href: '/docs/instrumentation/opentelemetry-python/fastapi',
            icon: <SiFastapi className="h-7 w-7 text-teal-500" />,
            clickName: 'FastAPI Instrumentation Link',
          },
          {
            name: 'Falcon',
            href: '/docs/instrumentation/opentelemetry-python/falcon',
            icon: <LuBird className="h-7 w-7 text-orange-500" />,
            clickName: 'Falcon Instrumentation Link',
          },
        ]}
        sectionName="Python Web Frameworks Section"
        gridCols="grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
      />
    </div>
  )

  const renderWorkersSection = () => (
    <div className="mb-10">
      <h2 className="mb-4 text-2xl font-semibold">Background Workers</h2>
      <IconCardGrid
        cards={[
          {
            name: 'Celery',
            href: '/docs/instrumentation/opentelemetry-python/celery',
            icon: <SiCelery className="h-7 w-7 text-green-600" />,
            clickName: 'Celery Instrumentation Link',
          },
        ]}
        sectionName="Python Background Workers Section"
        gridCols="grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
      />
    </div>
  )

  const renderAdvancedSection = () => (
    <div className="mb-10">
      <h2 className="mb-4 text-2xl font-semibold">Manual & Advanced Control</h2>
      <IconCardGrid
        cards={[
          {
            name: 'Manual Python Instrumentation',
            href: '/docs/instrumentation/manual-instrumentation/python/manual-instrumentation',
            icon: <LuWrench className="h-7 w-7 text-yellow-500" />,
            clickName: 'Manual Python Instrumentation Link',
          },
        ]}
        sectionName="Python Advanced Section"
        gridCols="grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
      />
    </div>
  )

  return (
    <div>
      <NavigationPills />

      {(activeSection === 'all' || activeSection === 'frameworks') && renderFrameworksSection()}
      {(activeSection === 'all' || activeSection === 'workers') && renderWorkersSection()}
      {(activeSection === 'all' || activeSection === 'advanced') && renderAdvancedSection()}
    </div>
  )
}
