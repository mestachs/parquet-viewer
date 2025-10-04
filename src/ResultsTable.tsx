import React, { useState } from 'react';

interface ResultsTableProps {
  results: any[];
}

export const ResultsTable: React.FC<ResultsTableProps> = ({ results }) => {
  const [page, setPage] = useState(0);
  const pageSize = 20;

  if (!results || results.length === 0) {
    return <div className="small">No rows</div>;
  }

  const cols = Object.keys(results[0]);
  const pageCount = Math.ceil(results.length / pageSize);

  const handlePrevPage = () => {
    setPage((p) => Math.max(0, p - 1));
  };

  const handleNextPage = () => {
    setPage((p) => Math.min(pageCount - 1, p + 1));
  };

  return (
    <div>
      <table>
        <thead>
          <tr>
            {cols.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {results.slice(page * pageSize, (page + 1) * pageSize).map((r, i) => (
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
      <div className="pagination">
        <button onClick={handlePrevPage} disabled={page === 0}>
          Previous
        </button>
        <span>
          Page {page + 1} of {pageCount}
        </span>
        <button onClick={handleNextPage} disabled={page === pageCount - 1}>
          Next
        </button>
      </div>
    </div>
  );
};