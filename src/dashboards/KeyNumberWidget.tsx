import { useMemo } from 'react'
import type { SupersetWidgetConfig, SupersetFilter } from './supersetModel'

export function KeyNumberWidget({
  config,
  data,
}: {
  config: SupersetWidgetConfig
  filters?: SupersetFilter[]
  data: any[]
}) {
  const value = useMemo(() => {
    if (data.length === 0) return null
    const first = Object.values(data[0])[0]
    return typeof first === 'number' ? first : Number(first)
  }, [data])

  return (
    <div className="p-4 shadow text-center">     
      <div className="text-3xl font-semibold">
        {value !== null ? value.toLocaleString() : '—'}
      </div>
    </div>
  )
}
