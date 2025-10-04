import { useEffect, useState } from 'react'
import { QueryModel } from './QueryModel'
import { useDuckDB } from './DuckDBProvider'
import { SupersetWidgetConfig, SupersetFilter } from './supersetModel'

export function TableWidget({
  config,
  filters = [],
}: {
  config: SupersetWidgetConfig
  filters?: SupersetFilter[]
}) {
  const { db, tableVersion } = useDuckDB()
  const [rows, setRows] = useState<any[]>([])

  useEffect(() => {
    if (!db) return
    const qm = new QueryModel(db, config, filters)
    qm.execute().then(setRows)
  }, [db, config, filters, tableVersion])

  if (!rows.length) return <div>Loading…</div>

  const cols = config.params.columns ? config.params.columns.map(col => col.label || col.column) : Object.keys(rows[0])
  const dataKeys = config.params.columns ? config.params.columns.map(col => col.label || col.column) : Object.keys(rows[0])

  return (
    <table className="border text-sm w-full">
      <thead>
        <tr>{cols.map(c => <th key={c} className="p-2 bg-gray-100">{c}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-t">
            {dataKeys.map(c => <td key={c} className="p-2">{String(r[c])}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
