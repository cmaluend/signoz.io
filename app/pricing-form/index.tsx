'use client'

import React, { useState } from 'react'
import styles from './styles.module.css'
import { useHubspotFormBypass } from '@/hooks/useHubspotFormBypass'

function PricingForm({ portalId, formId }) {
  const { loaded, error, formCreated } = useHubspotFormBypass({
    portalId,
    formId,
    target: '#my-hubspot-form',
  })
  return (
    <>
      <div id="my-hubspot-form">
        {!formCreated && !error && <p className="text--center">Loading...</p>}
        {error && <p className="text--center">Some error occurred.</p>}
      </div>
      {loaded && error && <p>Some error occurred.</p>}
    </>
  )
}

export default PricingForm
