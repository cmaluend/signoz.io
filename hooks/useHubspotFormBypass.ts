import { useEffect, useState } from 'react'

interface UseHubspotFormBypassProps {
  portalId: string
  formId: string
  target: string
  region?: 'na1' | 'eu1'
}

export function useHubspotFormBypass({
  portalId,
  formId,
  target,
  region = 'na1',
}: UseHubspotFormBypassProps) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const [formCreated, setFormCreated] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (window.hbspt) {
      createForm()
      return
    }

    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.charset = 'utf-8'

    script.src = '/scripts/hubspot-forms-v2.js'
    script.async = true

    script.onload = () => {
      setLoaded(true)
      createForm()
    }

    script.onerror = () => {
      console.error('Failed to load HubSpot form script')
      setError(true)
    }

    document.body.appendChild(script)

    function createForm() {
      if (window.hbspt) {
        try {
          window.hbspt.forms.create({
            region,
            portalId,
            formId,
            target,
            onFormReady: () => {
              setFormCreated(true)
            },
            onFormSubmitted: () => {
              console.log('Form submitted successfully')
            },
          })
        } catch (err) {
          console.error('Error creating form:', err)
          setError(true)
        }
      } else {
        setError(true)
      }
    }

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [portalId, formId, target, region])

  return { loaded, error, formCreated }
}

// TypeScript declaration
declare global {
  interface Window {
    hbspt?: {
      forms: {
        create: (config: {
          region: string
          portalId: string
          formId: string
          target: string
          onFormReady?: () => void
          onFormSubmitted?: () => void
        }) => void
      }
    }
  }
}
