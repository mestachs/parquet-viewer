import React, { useState } from 'react';

interface ResultsTableProps {
  results: any[];
}

export const ResultsTable: React.FC<ResultsTableProps> = ({ results }) => {
  const [page, setPage] = useState(0);
  const pageSize = 14;

  if (!results || results.length === 0) {
    return <div className="small text-gray-500 mt-4">No rows</div>;
  }

  const cols = Object.keys(results[0]);
  const pageCount = Math.ceil(results.length / pageSize);

  const handlePrevPage = () => {
    setPage((p) => Math.max(0, p - 1));
  };

  const handleNextPage = () => {
    setPage((p) => Math.min(pageCount - 1, p + 1));
  };

  const PaginationControls = () => (
    <div className="pagination flex justify-between items-center mt-4">
      <button
        onClick={handlePrevPage}
        disabled={page === 0}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        Previous
      </button>
      <span className="text-sm text-gray-700">
        Page {page + 1} of {pageCount}
      </span>
      <button
        onClick={handleNextPage}
        disabled={page === pageCount - 1}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );

  return (
    <div className="mt-4">
      <PaginationControls />
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 shadow-sm border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {cols.map((c) => (
                <th
                  key={c}
                  className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {results.slice(page * pageSize, (page + 1) * pageSize).map((r, i) => (
              <tr key={i}>
                {Object.values(r).map((v: any, j) => (
                  <td
                    key={j}
                    title={String(v ?? '')}
                    className="px-3 py-2 whitespace-nowrap text-sm text-gray-900"
                  >
                    {String(v ?? '').slice(0, 300)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PaginationControls />
    </div>
  );
};