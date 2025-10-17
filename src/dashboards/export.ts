
import { AsyncDuckDB } from "@duckdb/duckdb-wasm";

async function exportFile(
  db: AsyncDuckDB,
  sql: string,
  params: any[],
  fileName: string,
  mimeType: string,
  query: (conn: any, sql: string, params: any[], fileName: string) => Promise<any>,
  transform?: (buffer: Uint8Array) => Uint8Array
) {
  const conn = await db.connect();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fullFileName = `${fileName.split('.')[0]}-${timestamp}.${fileName.split('.')[1]}`

  await query(conn, sql, params, fullFileName);
  const buffer = await db.copyFileToBuffer(fullFileName);
  const finalBuffer = transform ? transform(buffer) : buffer;
  const blob = new Blob([finalBuffer], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fullFileName;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportCsv(db: AsyncDuckDB, sql: string, params: any[]) {
  await exportFile(
    db,
    sql,
    params,
    "export.csv",
    "text/csv",
    async (conn, sql, params, fileName) => {
      const stmt = await conn.prepare(
        `COPY (${sql}) TO '${fileName}' (FORMAT CSV, HEADER TRUE)`
      );
      await stmt.query(...params);
    }
  );
}

export async function exportParquet(db: AsyncDuckDB, sql: string, params: any[]) {
  await exportFile(
    db,
    sql,
    params,
    "export.parquet",
    "application/octet-stream",
    async (conn, sql, params, fileName) => {
      const stmt = await conn.prepare(
        `COPY (${sql}) TO '${fileName}' (FORMAT PARQUET)`
      );
      await stmt.query(...params);
    }
  );
}

export async function exportXlsx(db: AsyncDuckDB, sql: string, params: any[]) {
    await exportFile(db, sql, params, "export.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", async (conn, sql, params, fileName) => {
        await conn.query(`INSTALL excel; LOAD excel;`);
        const stmt = await conn.prepare(`COPY (${sql}) TO '${fileName}' (FORMAT XLSX, HEADER TRUE)`);
        await stmt.query(...params);
    }, (buffer) => buffer.slice(1));
}
