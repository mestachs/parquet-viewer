
import { useState, useEffect, useRef } from 'react';
import * as duckdb from '@duckdb/duckdb-wasm';

export function ParquetViewer() {
  const [db, setDb] = useState<duckdb.AsyncDuckDB | null>(null);
  const [conn, setConn] = useState<duckdb.AsyncDuckDBConnection | null>(null);
  const [status, setStatus] = useState('Loading duckdb-wasm...');
  const [sql, setSql] = useState("SELECT * FROM read_parquet('uploaded.parquet')");
  const [results, setResults] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [sampleLimit, setSampleLimit] = useState(25);

  const initDuckDB = async () => {
    try {
      const bundles = duckdb.getJsDelivrBundles();
      const bundle = await duckdb.selectBundle(bundles);

      const worker_url = URL.createObjectURL(
        new Blob([`importScripts("${bundle.mainWorker}");`], {
          type: 'text/javascript',
        })
      );
      const worker = new Worker(worker_url);
      const logger = new duckdb.ConsoleLogger();
      const asyncDB = new duckdb.AsyncDuckDB(logger, worker);

      await asyncDB.instantiate(bundle.mainModule, bundle.pthreadWorker);
      setDb(asyncDB);
      const connection = await asyncDB.connect();
      setConn(connection);
      setStatus('DuckDB ready');
    } catch (e: any) {
      setStatus('Failed to init: ' + e.message);
      console.error(e);
    }
  };

  useEffect(() => {
    initDuckDB();
  }, []);

  const registerFile = async (file: File) => {
    if (!db) return;
    setStatus(`Registering ${file.name}...`);
    const buf = await file.arrayBuffer();
    const u8 = new Uint8Array(buf);
    const name = 'uploaded.parquet';
    await db.registerFileBuffer(name, u8);
    setStatus(`Registered as ${name}`);
  };

  const runSQL = async (query: string) => {
    if (!conn) return;

    let q = query;
    let addedLimit = false;
    const limit = 1000;
    if (!/limit\s+\d+/i.test(q)) {
      q += ` LIMIT ${limit}`;
      addedLimit = true;
    }

    setStatus('Running query...');
    try {
      const start = performance.now();
      const res = await conn.query(q);
      const arr = await res.toArray();
      const end = performance.now();

      const rows = arr.length;
      const cols = arr[0] ? Object.keys(arr[0]).length : 0;

      setResults(arr);
      setStatus(
        `Query finished in ${(end - start).toFixed(1)} ms. Shape: ${rows} rows × ${cols} columns. ${
          addedLimit ? 'added limit of ' + limit + 'to keep ui performant' : ''
        }`
      );
    } catch (err: any) {
      setStatus('Error: ' + err.message);
      setResults([]);
    }
  };

  const preview = async () => {
    const newSql = `SELECT * FROM read_parquet('uploaded.parquet') LIMIT ${sampleLimit};`;
    setSql(newSql);
    await runSQL(newSql);
  };

  const exportCsv = async (sql: string) => {
    if (!conn || !db) return;
    const outName = 'export.csv';
    await conn.query(`COPY (${sql}) TO '${outName}' (FORMAT CSV, HEADER TRUE)`);
    const buffer = await db.copyFileToBuffer(outName);
    const blob = new Blob([buffer], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = outName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadXlsx = async (sql: string) => {
    if (!conn || !db) return;
    const outName = 'export.xlsx';
    await conn.query(`INSTALL excel; LOAD excel;COPY (${sql}) TO '${outName}' (FORMAT XLSX, HEADER TRUE)`);
    const buffer = await db.copyFileToBuffer(outName);
    const firstByte = buffer[0];
    const correctedBuffer = buffer.slice(1);
    const blob = new Blob([correctedBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = outName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    if (f) {
      setFile(f);
      registerFile(f);
    }
  };

  return (
    <div>
      <h1>Parquet viewer powered by DuckDB</h1>
      <div className="controls">
        <input id="parquet" type="file" accept=".parquet" onChange={handleFileChange} />
        <button onClick={() => file && registerFile(file)} disabled={!file || !db}>
          Load into DuckDB
        </button>
        <select value={sampleLimit} onChange={(e) => setSampleLimit(Number(e.target.value))}>
          <option value="25">25</option>
          <option value="100">100</option>
          <option value="500">500</option>
        </select>
        <button onClick={preview} disabled={!file || !db}>
          Preview
        </button>
      </div>
      <div className="small">Library served from jsDelivr CDN. Works fully in-browser (no server).</div>

      <label>SQL (you may use <code>read_parquet('uploaded.parquet')</code>):</label>
      <textarea value={sql} onChange={(e) => setSql(e.target.value)} />
      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
        <button onClick={() => runSQL(sql)} disabled={!file || !db}>
          Run SQL
        </button>
        <button onClick={() => exportCsv(sql)} disabled={!file || !db}>
          CSV
        </button>
        <button onClick={() => downloadXlsx(sql)} disabled={!file || !db}>
          Excel
        </button>
        <div className="small">{status}</div>
      </div>

      {results.length > 0 ? (
        <table>
          <thead>
            <tr>
              {Object.keys(results[0]).map((c) => (
                <th key={c}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => (
              <tr key={i}>
                {Object.values(r).map((v: any, j) => (
                  <td key={j} title={String(v ?? '')}>
                    {String(v ?? '').slice(0, 300)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="small">No rows</div>
      )}
    </div>
  );
}
