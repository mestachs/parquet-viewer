
import React, { useState } from 'react';
import { WidgetDebugModal } from './WidgetDebugModal';
import type { SupersetWidgetConfig, SupersetFilter } from './supersetModel';
import { useDuckDb } from 'duckdb-wasm-kit';

interface WidgetContainerProps {
  children: React.ReactNode;
  config: SupersetWidgetConfig;
  filters: SupersetFilter[];
  query: string | null;
  params: any[] | null;
}

export function WidgetContainer({ children, config, filters, query, params }: WidgetContainerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { db } = useDuckDb();

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
    if (db == undefined) {
      return;
    }
    const conn = await db?.connect();
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

  return (
    <div className="relative">
      {children}    
      <div className="dropdown dropdown-end absolute top-2 right-2">
        <label tabIndex={0} className="btn btn-ghost btn-xs">...</label>
        <ul tabIndex={0} className="bg-beige dropdown-content menu p-2 shadow rounded-box w-52">
          <li><a onClick={() => setIsModalOpen(true)}>Query</a></li>
          <li><a onClick={() => exportCsv(query || '')}>Download CSV</a></li>
          <li><a onClick={() => downloadXlsx(query || '')}>Download XLSX</a></li>
        </ul>
      </div>
      <WidgetDebugModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        query={query || ''}
        params={params || []}
      />
    </div>
  );
}
