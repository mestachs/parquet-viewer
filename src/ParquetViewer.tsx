import { useState, useEffect, useRef, useCallback } from "react";
import * as duckdb from "@duckdb/duckdb-wasm";
import { useDuckDb } from "duckdb-wasm-kit";
import { ResultsTable } from "./ResultsTable";

// Debounce utility function
const debounce = (func: Function, delay: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
};

export function ParquetViewer() {
  const { db, loading: dbLoading, error: dbError } = useDuckDb();
  const [status, setStatus] = useState("Loading duckdb-wasm...");
  const [sql, setSql] = useState(
    "SELECT * FROM read_parquet('uploaded.parquet')"
  );
  const [results, setResults] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [sampleLimit, setSampleLimit] = useState(25);

  const registerFile = async (file: File) => {
    if (!db) return;
    setStatus(`Registering ${file.name}...`);
    const buf = await file.arrayBuffer();
    const u8 = new Uint8Array(buf);
    const name = "uploaded.parquet";
    await db.registerFileBuffer(name, u8);
    setStatus(`Registered as ${name}`);
  };

  const runSQL = useCallback(async (query: string) => {
    console.log(query, db);

    let q = query;
    let addedLimit = false;

    setStatus("Running query...");
    try {
      const start = performance.now();
      debugger;
      const conn = await db.connect();
      const res = await conn.query(q);
      const arr = await res.toArray();
      const end = performance.now();

      const rows = arr.length;
      const cols = arr[0] ? Object.keys(arr[0]).length : 0;
      setResults(arr);
      setStatus(
        `Query finished in ${(end - start).toFixed(
          1
        )} ms. Shape: ${rows} rows × ${cols} columns. ${
          addedLimit ? "added limit of " + limit + "to keep ui performant" : ""
        }`
      );
    } catch (err: any) {
      setStatus("Error: " + err.message);
      setResults([]);
    }
  }, [db]);

  const debouncedSetSql = useCallback(debounce(setSql, 500), []);

  const preview = async () => {
    const newSql = `SELECT * FROM read_parquet('uploaded.parquet') LIMIT ${sampleLimit};`;
    setSql(newSql);
    await runSQL(newSql);
  };

  const exportCsv = async (sql: string) => {
    if (db == undefined) {
      return;
    }
    const conn = await db?.connect();
    const outName = "export.csv";
    await conn.query(`COPY (${sql}) TO '${outName}' (FORMAT CSV, HEADER TRUE)`);
    const buffer = await db.copyFileToBuffer(outName);
    const blob = new Blob([buffer], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = outName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadXlsx = async (sql: string) => {
    if (!conn || !db) return;
    const outName = "export.xlsx";
    await conn.query(
      `INSTALL excel; LOAD excel;COPY (${sql}) TO '${outName}' (FORMAT XLSX, HEADER TRUE)`
    );
    const buffer = await db.copyFileToBuffer(outName);
    const firstByte = buffer[0];
    const correctedBuffer = buffer.slice(1);
    const blob = new Blob([correctedBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
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
      {dbError?.message}
      <div className="controls">
        <input
          id="parquet"
          type="file"
          accept=".parquet"
          onChange={handleFileChange}
        />
        <button
          onClick={() => file && registerFile(file)}
          disabled={!file || !db}
        >
          Load into DuckDB
        </button>
        <select
          value={sampleLimit}
          onChange={(e) => setSampleLimit(Number(e.target.value))}
        >
          <option value="25">25</option>
          <option value="100">100</option>
          <option value="500">500</option>
        </select>
        <button onClick={preview} disabled={!file || !db}>
          Preview
        </button>
      </div>
      <div className="small">Works fully in-browser (no server).</div>

      <label>
        SQL (you may use <code>read_parquet('uploaded.parquet')</code>):
      </label>
      <textarea value={sql} onChange={(e) => debouncedSetSql(e.target.value)} />
      <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
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

      <ResultsTable results={results} />
    </div>
  );
}
