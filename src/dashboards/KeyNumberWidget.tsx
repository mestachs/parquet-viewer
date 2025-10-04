import { useEffect, useState } from 'react'
import { QueryModel } from './QueryModel'
import { useDuckDB } from './DuckDBProvider'
import { SupersetWidgetConfig, SupersetFilter } from './supersetModel'

export function KeyNumberWidget({
  config,
  filters = [],
}: {
  config: SupersetWidgetConfig
  filters?: SupersetFilter[]
}) {
  const { db, tableVersion } = useDuckDB()
  const [value, setValue] = useState<number | null>(null)

  useEffect(() => {
    if (!db) return
    const qm = new QueryModel(db, config, filters)
    qm.execute().then(rows => {
      if (rows.length === 0) return setValue(null)
      const first = Object.values(rows[0])[0]
      setValue(typeof first === 'number' ? first : Number(first))
    })
  }, [db, config, filters, tableVersion])

  return (
    <div className="p-4 bg-white shadow rounded-2xl text-center">
      {config.label && <div className="text-gray-500 text-sm">{config.label}</div>}
      <div className="text-3xl font-semibold">
        {value !== null ? value.toLocaleString() : '—'}
      </div>
    </div>
  )
}
