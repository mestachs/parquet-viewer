
import React, { useState } from 'react';
import { WidgetDebugModal } from './WidgetDebugModal';
import type { SupersetWidgetConfig, SupersetFilter } from './supersetModel';
import { useDuckDb } from 'duckdb-wasm-kit';
import { RawDataModal } from './RawDataModal';
import { ExportMenuItem } from './ExportMenuItem';
import { exportCsv, exportParquet, exportXlsx } from './export';

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
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<Error | null>(null);

  const handleExport = async (exportFunction: (db: any, sql: string, params: any[]) => Promise<void>) => {
    if (db == undefined) {
      return;
    }
    setIsExporting(true);
    setExportError(null);
    try {
      await exportFunction(db, query || '', params || []);
    } catch (e: any) {
      setExportError(e);
    } finally {
      setIsExporting(false);
    }
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
          {exportError && (
            <div className="text-red-500 mr-2" title={exportError.message}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 cursor-pointer" fill="none" viewBox="0 0 24 24" stroke="currentColor" >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          )}
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-ghost btn-xs">...</label>
            <ul tabIndex={0} className="bg-beige dropdown-content menu p-2 shadow rounded-box w-52">
              <li><a onClick={() => setIsRawDataModalOpen(true)}>View Raw Data</a></li>
              <li><a onClick={() => setIsModalOpen(true)}>Query</a></li>
              <ExportMenuItem
                exportHandler={() => handleExport(exportCsv)}
                label="Download CSV"
                isExporting={isExporting}
                exportError={exportError}
              />
              <ExportMenuItem
                exportHandler={() => handleExport(exportXlsx)}
                label="Download XLSX"
                isExporting={isExporting}
                exportError={exportError}
              />
              <ExportMenuItem
                exportHandler={() => handleExport(exportParquet)}
                label="Download Parquet"
                isExporting={isExporting}
                exportError={exportError}
              />
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
