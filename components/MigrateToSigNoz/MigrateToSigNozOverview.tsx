import React from 'react'
import {
  SiKubernetes,
  SiGrafana,
  SiElastic,
  SiDatadog,
  SiNewrelic,
  SiOpentelemetry,
} from 'react-icons/si'
import IconCardGrid from '../Card/IconCardGrid'

interface IconCardData {
  name: string
  href: string
  icon: React.ReactNode
  clickName: string
}

const MigrateVendorsData: IconCardData[] = [
  {
    name: 'Switch from Datadog',
    href: '/docs/switch-to-signoz/switch-from-datadog/',
    icon: <SiDatadog className="h-7 w-7 text-purple-500" />,
    clickName: 'Switch from Datadog',
  },
  {
    name: 'Switch from Grafana',
    href: '/docs/switch-to-signoz/switch-from-grafana/',
    icon: <SiGrafana className="h-7 w-7 text-orange-500" />,
    clickName: 'Switch from Grafana',
  },
  {
    name: 'Switch from ELK',
    href: '/docs/switch-to-signoz/switch-from-elk/',
    icon: <SiElastic className="h-7 w-7 text-pink-600" />,
    clickName: 'Switch from ELK',
  },
  {
    name: 'Switch from New Relic',
    href: '/docs/switch-to-signoz/switch-from-newrelic/',
    icon: <SiNewrelic className="h-7 w-7 text-green-500" />,
    clickName: 'Switch from New Relic',
  },
  {
    name: 'Switch from OpenTelemetry',
    href: '/docs/switch-to-signoz/switch-from-opentelemetry-to-signoz/',
    icon: <SiOpentelemetry className="h-7 w-7 text-blue-500" />,
    clickName: 'Switch from OpenTelemetry',
  },
  {
    name: 'Switch from Self-Hosted SigNoz',
    href: '/docs/switch-to-signoz/switch-to-signoz-cloud/',
    icon: (
        // eslint-disable-next-line @next/next/no-img-element
        <img
        src="/svgs/icons/signoz.svg"
        alt="SigNoz"
        className="h-7 w-7 object-contain"
        />
    ),
    clickName: 'Switch from Self-Hosted SigNoz',
    }

]

export default function MigrateToSigNoz() {
  return (
    <IconCardGrid
      cards={MigrateVendorsData}
      sectionName="Vendors Switch Section"
      viewAllText="View all migration guides"
      gridCols="grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4"
    />
  )
}
