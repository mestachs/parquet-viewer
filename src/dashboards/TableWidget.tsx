import { useState } from 'react'
import type { SupersetWidgetConfig, SupersetFilter } from './supersetModel'

export function TableWidget({
  config,
  data,
}: {
  config: SupersetWidgetConfig
  filters?: SupersetFilter[]
  data: any[]
}) {
  const [page, setPage] = useState(0)
  const pageSize = 10
  if (!data.length) return <div>Loading…</div>

  const cols = config.params.columns ? config.params.columns.map(col => col.label || col.column) : Object.keys(data[0])
  const dataKeys = config.params.columns ? config.params.columns.map(col => col.label || col.column) : Object.keys(data[0])

  const totalPages = Math.ceil(data.length / pageSize)

  return (
    <>
      <table className="border text-sm w-full">
        <thead>
          <tr>{cols.map(c => <th key={c} className="p-2">{c}</th>)}</tr>
        </thead>
        <tbody>
          {data.slice(page * pageSize, (page + 1) * pageSize).map((r, i) => (
            <tr key={i} className="border-t">
              {dataKeys.map(c => <td key={c} className="p-2 whitespace-nowrap">{r[c] ?? ''}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-4 py-2">
          <span className="text-sm text-gray-500">Total records: {data.length}</span>
          <button
            className="rounded border p-2 text-sm disabled:opacity-50"
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
          >
            Previous
          </button>
          <span className="text-sm">
            Page {page + 1} of {totalPages}
          </span>
          <button
            className="rounded border p-2 text-sm disabled:opacity-50"
            disabled={(page + 1) * pageSize >= data.length}
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </>
  )
}
