import { useState, useEffect, useCallback, useRef } from "react";
import * as duckdb from "@duckdb/duckdb-wasm";
import { useDuckDb } from "duckdb-wasm-kit";
import { ResultsTable } from "./ResultsTable";
import { useNavigate } from "react-router-dom";
import {
  exportCsv,
  exportParquet,
  exportSqlite,
  exportXlsx,
} from "./dashboards/export";

const disableSqlite = true;

export function ParquetViewer() {
  const { db, loading: dbLoading, error: dbError } = useDuckDb();
  const navigate = useNavigate();
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.has("dashboard")) {
      navigate("/dashboard/orgunits");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [navigate]);

  useEffect(() => {
    if (db) {
      const installExtensions = async () => {
        setStatus("Installing extensions...");
        try {
          const conn = await db.connect();
          await conn.query("INSTALL spatial;");
          await conn.query("LOAD spatial;");
          setStatus("Installing extensions... spatial");
          await conn.query("INSTALL excel;");
          await conn.query("LOAD excel;");
          setStatus("Installing extensions... excel");
          setStatus("Extensions spatial and excel installed.");
        } catch (err: any) {
          setStatus("Error installing extensions: " + err.message);
        }
      };
      installExtensions();
    }
  }, [db]);

  const [status, setStatus] = useState("Loading duckdb-wasm...");
  const [sql, setSql] = useState("");
  const [lastSql, setLastSql] = useState("");

  const [results, setResults] = useState<any[]>([]);
  const [dbFiles, setDbFiles] = useState<duckdb.WebFile[]>([]);

  const [exporting, setExporting] = useState(false);

  const refreshFiles = useCallback(async () => {
    if (!db) return;
    const files = await db.globFiles("*");
    debugger;
    setDbFiles(files);
  }, [db]);

  useEffect(() => {
    refreshFiles();
  }, [refreshFiles]);

  const registerFiles = async (files: File[]) => {
    if (!db) return;
    for (const file of files) {
      setStatus(`Registering ${file.name}...`);
      const buf = await file.arrayBuffer();
      const u8 = new Uint8Array(buf);
      await db.registerFileBuffer(file.name, u8);
      setStatus(`Registered as ${file.name}`);
    }
    await refreshFiles();
  };

  const runSQL = useCallback(
    async (query: string) => {
      console.log(query, db);

      let q = query;

      setStatus("Running query...");
      try {
        const start = performance.now();
        const conn = await db.connect();
        const res = await conn.query(q);
        const arr = await res.toArray();
        const end = performance.now();

        const rows = arr.length;
        const cols = arr[0] ? Object.keys(arr[0]).length : 0;
        setResults(arr);
        setLastSql(query);
        setStatus(
          `Query finished in ${(end - start).toFixed(
            1
          )} ms. Shape: ${rows} rows × ${cols} columns.`
        );
      } catch (err: any) {
        setStatus("Error: " + err.message);
        setResults([]);
      }
    },
    [db]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
    if (selectedFiles.length > 0) {
      registerFiles(selectedFiles);

      const statements = [];
      for (let file of selectedFiles) {
        if (file.name.endsWith(".parquet")) {
          statements.push(`SELECT * FROM read_parquet('${file.name}')`);
        } else if (file.name.endsWith(".csv")) {
          statements.push(`SELECT * FROM read_csv_auto('${file.name}')`);
        } else if (file.name.endsWith(".xlsx")) {
          statements.push(`SELECT * FROM read_xlsx('${file.name}')`);
        }
        setSql(statements.join(";\n"));
      }
    }
  };

  return (
    <div className="ml-4">
      <div className="controls flex items-center gap-2 mt-4">
        <h1 className="text-2xl font-bold">Parquet viewer powered by DuckDB</h1>
        <div className="small text-gray-500">
          Works fully in-browser (no server). You can select several files (parquet, xlsx, csv).
        </div>
        <div className="controls flex items-center gap-2 mt-4">
          <input
            id="parquet"
            type="file"
            accept=".parquet,.csv,.xlsx"
            multiple
            onChange={handleFileChange}
            className="file-input"
          />
        </div>
      </div>
      {dbError?.message}

      <label className="block text-sm font-medium mb-2 mt-4 mr-4">SQL:</label>
      <div className="flex w-full">
        <textarea
          ref={textAreaRef}
          value={sql}
          onChange={(e) => setSql(e.target.value)}
          className="textarea w-1/2 p-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm mr-4"
          rows={5}
        />
        <div className="w-1/2 border rounded-md p-2">
          <h3 className="text-sm font-medium">Available files:</h3>
          <ul>
            {dbFiles.map((file) => (
              <li key={file.fileName}>{file.fileName}</li>
            ))}
          </ul>
        </div>
      </div>
      <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
        <button
          onClick={() => {
            const textarea = textAreaRef.current;
            if (textarea) {
              const { selectionStart, selectionEnd } = textarea;
              const selectedSql = sql.substring(selectionStart, selectionEnd);
              if (selectedSql) {
                runSQL(selectedSql);
              } else {
                runSQL(sql);
              }
            } else {
              runSQL(sql);
            }
          }}
          disabled={!db}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Run SQL
        </button>
        {db && (
          <button
            onClick={async () => {
              setExporting(true);
              try {
                await exportCsv(db, sql, []);
              } finally {
                setExporting(false);
              }
            }}
            disabled={dbFiles.length === 0 || !db || exporting}
            className="px-4 py-2 bg-green-800 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            CSV
          </button>
        )}
        {db && (
          <button
            onClick={async () => {
              setExporting(true);
              try {
                await exportXlsx(db, sql, []);
              } finally {
                setExporting(false);
              }
            }}
            disabled={dbFiles.length === 0 || !db || exporting}
            className="px-4 py-2 bg-green-800 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            Excel
          </button>
        )}
        {db && (
          <button
            onClick={async () => {
              setExporting(true);
              try {
                await exportParquet(db, sql, []);
              } finally {
                setExporting(false);
              }
            }}
            disabled={dbFiles.length === 0 || !db || exporting}
            className="px-4 py-2 bg-green-800 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            Parquet
          </button>
        )}

        {db && !disableSqlite && (
          <button
            onClick={async () => {
              setExporting(true);
              try {
                const tableName = "results";
                const filename = "query_export.db";
                const timestamp = new Date()
                  .toISOString()
                  .replace(/[:.]/g, "-");
                /*const fullFileName = `${filename.split(".")[0]}-${timestamp}.${
                  filename.split(".")[1]
                }`;*/
                const fullFileName = filename;
                const conn = await db.connect();

                console.log("duckdb version", await db.getVersion());
                try {
                  await db.dropFile(fullFileName);
                } catch (_) {}

                // Register an empty file buffer
                // await db.registerFileBuffer(fullFileName, new Uint8Array());

                // Execute statements separately
                await conn.query(
                  `ATTACH '${fullFileName}' AS sqlite_db (TYPE SQLITE);`
                );
                console.log(`CREATE TABLE sqlite_db.${tableName} AS ${sql};`);
                await conn.query(
                  `CREATE TABLE sqlite_db.${tableName} AS ${sql};`
                );
                const check = await conn.query(
                  `SELECT COUNT(*) AS cnt FROM sqlite_db.${tableName};`
                );
                console.log("Row count:", check.get(0).cnt);
                await db.flushFiles();
                await conn.query(`DETACH sqlite_db;`);
                await db.flushFiles();

                // Give it a moment to flush
                await new Promise((resolve) => setTimeout(resolve, 1000));

                const buffer = await db.copyFileToBuffer(fullFileName);
                // Give it a moment to flush
                await new Promise((resolve) => setTimeout(resolve, 1000));

                const blob = new Blob([buffer], {
                  type: "application/x-sqlite3",
                });
                const url = URL.createObjectURL(blob);

                const a = document.createElement("a");
                a.href = url;
                a.download = fullFileName;
                a.click();
                URL.revokeObjectURL(url);
              } finally {
                setExporting(false);
              }
            }}
            disabled={dbFiles.length === 0 || !db || exporting}
            className="px-4 py-2 bg-green-800 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            SQLite
          </button>
        )}

        <div className="small">{status}</div>
      </div>
      <br></br>
      <hr></hr>

      <ResultsTable key={lastSql} results={results} />
    </div>
  );
}
