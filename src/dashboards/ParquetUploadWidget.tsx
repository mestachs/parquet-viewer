import { useState } from 'react'
import { useDuckDB } from './DuckDBProvider'
import { DuckDBDataProtocol } from '@duckdb/duckdb-wasm'

export function ParquetUploadWidget() {
  const { db, refreshTables } = useDuckDB()
  const [tableName, setTableName] = useState('orgunits')
  const [status, setStatus] = useState('')

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !db) return

    setStatus('Registering...')

    try {
      // Register file as a virtual DuckDB table
      await db.registerFileHandle(file.name, file, DuckDBDataProtocol.BROWSER_FILEREADER)
      const conn = await db.connect()
      await conn.query(`CREATE OR REPLACE TABLE ${tableName} AS SELECT * FROM read_parquet('${file.name}')`)
      await conn.close()

      setStatus(`✅ Registered table: ${tableName}`)
      refreshTables()
    } catch (err) {
      console.error(err)
      setStatus('❌ Failed to register file')
    }
  }

  return (
    <div className="p-4 border rounded-2xl bg-gray-50">
      <div className='flex items-center gap-2'>
        <label className="block text-sm font-medium mb-2">Upload Parquet File</label>
        <input type="file" accept=".parquet" onChange={handleUpload} />
      </div>
      <div className='flex items-center gap-2'>
        <label className="block text-sm font-medium mb-2">Table Name</label>
        <input
          type="text"
          value={tableName}
          onChange={e => setTableName(e.target.value)}
          className="border rounded px-2 py-1"
        />
      </div>


      {status && <div className="mt-2 text-sm text-gray-700">{status}</div>}
      {tableName && (
        <div className="mt-1 text-xs text-gray-500">
          Table name: <code>{tableName}</code>
        </div>
      )}
    </div>
  )
}
