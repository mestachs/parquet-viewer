
import React, { useState } from 'react';
import { WidgetDebugModal } from './WidgetDebugModal';
import type { SupersetWidgetConfig, SupersetFilter } from './supersetModel';
import { useDuckDb } from 'duckdb-wasm-kit';
import { RawDataModal } from './RawDataModal';

interface WidgetContainerProps {
  children: React.ReactNode;
  config: SupersetWidgetConfig;
  filters: SupersetFilter[];
  query: string | null;
  params: any[] | null;
  data: any[];
  error: Error | null;
}

export function WidgetContainer({ children, config, filters, query, params, data, error }: WidgetContainerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRawDataModalOpen, setIsRawDataModalOpen] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
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

  const renderTitle = () => {
    return <h2 className="font-bold text-lg">{(config as any).label}</h2>;
  }

  return (
    <div className="relative card bg-base-100 p-4 m-1">
      <div className="flex justify-between items-center mb-4">
        {renderTitle()}
        <div className="flex items-center">
          {error && (
            <div className="text-red-500 mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 cursor-pointer" fill="none" viewBox="0 0 24 24" stroke="currentColor" onClick={() => setIsErrorModalOpen(true)}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          )}
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-ghost btn-xs">...</label>
            <ul tabIndex={0} className="bg-beige dropdown-content menu p-2 shadow rounded-box w-52">
              <li><a onClick={() => setIsRawDataModalOpen(true)}>View Raw Data</a></li>
              <li><a onClick={() => setIsModalOpen(true)}>Query</a></li>
              <li><a onClick={() => exportCsv(query || '')}>Download CSV</a></li>
              <li><a onClick={() => downloadXlsx(query || '')}>Download XLSX</a></li>
            </ul>
          </div>
        </div>
      </div>
      {children}
      <WidgetDebugModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        query={query || ''}
        params={params || []}
        error={null}
      />
      <WidgetDebugModal
        isOpen={isErrorModalOpen}
        onClose={() => setIsErrorModalOpen(false)}
        query={query || ''}
        params={params || []}
        error={error}
      />
      {isRawDataModalOpen && <RawDataModal
        isOpen={isRawDataModalOpen}
        onClose={() => setIsRawDataModalOpen(false)}
        data={data}
      />}
    </div>
  );
}
