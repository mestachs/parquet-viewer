import type { SupersetWidgetConfig, SupersetFilter } from './supersetModel'

export function TableWidget({
  config,
  data,
}: {
  config: SupersetWidgetConfig
  filters?: SupersetFilter[]
  data: any[]
}) {
  if (!data.length) return <div>Loading…</div>

  const cols = config.params.columns ? config.params.columns.map(col => col.label || col.column) : Object.keys(data[0])
  const dataKeys = config.params.columns ? config.params.columns.map(col => col.label || col.column) : Object.keys(data[0])

  return (
    <table className="border text-sm w-full">
      <thead>
        <tr>{cols.map(c => <th key={c} className="p-2">{c}</th>)}</tr>
      </thead>
      <tbody>
        {data.map((r, i) => (
          <tr key={i} className="border-t">
            {dataKeys.map(c => <td key={c} className="p-2">{String(r[c])}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
