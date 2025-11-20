'use client'
import React, { useState, useEffect } from 'react'
import { SparklesIcon } from '@heroicons/react/24/outline'
import ChatModal from './ChatModal'
import useSearchShortcut from '@/hooks/useSearchShortcut'
import { useLogEvent } from '@/hooks/useLogEvent'

interface SearchBarProps {
  placeholder?: string | string[]
  className?: string
  rotationInterval?: number // milliseconds, defaults to 2000
  clickLocation?: string // Location where the SearchBar is used for tracking
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Ask anything about SigNoz...',
  className = '',
  rotationInterval = 2000,
  clickLocation = 'page', // default fallback location
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0)

  // Convert placeholder to array for consistent handling
  const placeholders = Array.isArray(placeholder) ? placeholder : [placeholder]
  const currentPlaceholder = placeholders[currentPlaceholderIndex]

  // Rotate placeholders if there are multiple
  useEffect(() => {
    if (placeholders.length <= 1) return

    const interval = setInterval(() => {
      setCurrentPlaceholderIndex((prevIndex) => (prevIndex + 1) % placeholders.length)
    }, rotationInterval)

    return () => clearInterval(interval)
  }, [placeholders.length, rotationInterval])

  // Enable / shortcut
  useSearchShortcut({
    onOpen: () => setIsModalOpen(true),
    isEnabled: !isModalOpen,
  })

  const logEvent = useLogEvent()

  const handleClick = () => {
    // Track the click with contextual information
    logEvent({
      eventName: 'Website Click',
      eventType: 'track',
      attributes: {
        clickType: 'AI Chat Click',
        clickName: 'AI Chat Click',
        clickLocation: clickLocation,
        clickText: 'AI Chat Click',
        currentPlaceholder: currentPlaceholder,
        placeholderIndex: currentPlaceholderIndex,
      },
    })

    setIsModalOpen(true)
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleClick()
    }
  }

  return (
    <>
      <div
        className={`group relative flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-signoz_slate-200/80 bg-gradient-to-r from-signoz_ink-500/95 via-signoz_ink-400 to-signoz_ink-300/90 px-5 py-4 shadow-[0_18px_50px_-32px_rgba(0,0,0,0.95)] transition-all duration-200 hover:-translate-y-0.5 hover:border-signoz_robin-400/80 hover:shadow-[0_22px_60px_-34px_rgba(0,0,0,1)] focus-within:border-signoz_robin-400 focus-within:ring-4 focus-within:ring-signoz_robin-500/25 ${className}`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label="Open search and chat interface"
      >
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-signoz_slate-100/20 text-signoz_vanilla-200 shadow-inner shadow-signoz_ink-500/60 transition-all duration-200 group-hover:bg-signoz_slate-100/30 group-focus-within:bg-signoz_slate-100/30">
          <SparklesIcon className="h-5 w-5" />
        </div>
        <span className="flex-1 text-left text-base font-medium text-signoz_vanilla-200 transition-all duration-300">
          {currentPlaceholder}
        </span>
        <kbd className="rounded-md border border-signoz_slate-100/60 bg-signoz_slate-300/60 px-2.5 py-1 font-mono text-xs font-semibold text-signoz_vanilla-100 shadow-sm shadow-signoz_ink-300/40">
          /
        </kbd>
      </div>

      <ChatModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
}

export default SearchBar
