import React from 'react';

interface ResultsTableProps {
  results: any[];
}

export const ResultsTable: React.FC<ResultsTableProps> = ({ results }) => {
  if (!results || results.length === 0) {
    return <div className="small">No rows</div>;
  }

  const cols = Object.keys(results[0]);

  return (
    <table>
      <thead>
        <tr>
          {cols.map((c) => (
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
  );
};
