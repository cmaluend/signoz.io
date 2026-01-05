'use client'

import React, { useState } from 'react'

interface TextTooltipProps {
  content: string
  children: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
}

const TextTooltip: React.FC<TextTooltipProps> = ({ content, children, position = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false)

  const positionClasses = {
    // 'left-1/2 transform -translate-x-1/2' to center horizontally
    top: 'bottom-full mb-2 left-1/2 transform -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 transform -translate-x-1/2',

    // 'top-1/2 transform -translate-y-1/2' to center vertically
    left: 'right-full mr-2 top-1/2 transform -translate-y-1/2',
    right: 'left-full ml-2 top-1/2 transform -translate-y-1/2',
  }

  const arrowClasses = {
    top: 'top-full left-1/2 transform -translate-x-1/2 border-t-gray-900 border-l-transparent border-r-transparent border-b-transparent',
    bottom:
      'bottom-full left-1/2 transform -translate-x-1/2 border-b-gray-900 border-l-transparent border-r-transparent border-t-transparent',
    left: 'left-full top-1/2 transform -translate-y-1/2 border-l-gray-900 border-t-transparent border-b-transparent border-r-transparent',
    right:
      'right-full top-1/2 transform -translate-y-1/2 border-r-gray-900 border-t-transparent border-b-transparent border-l-transparent',
  }

  return (
    <>
      <span
        // `inline` ensures browser search and find the wrapped text
        className="relative inline cursor-help border-b border-dashed border-blue-400"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}

        {isVisible && (
          <div
            className={`pointer-events-none absolute z-50 whitespace-nowrap rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white shadow-lg ${positionClasses[position]}`}
          >
            {content}
            <div className={`absolute h-0 w-0 border-4 ${arrowClasses[position]}`} />
          </div>
        )}
      </span>
    </>
  )
}

export default TextTooltip
