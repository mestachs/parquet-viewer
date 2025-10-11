
import React from 'react';

function prettyPrintSql(sql: string): string {
  const keywords = [
    'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'HAVING',
    'AND', 'OR', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'OUTER JOIN',
    'ON', 'LIMIT', 'OFFSET', 'UNION', 'INSERT INTO', 'UPDATE', 'DELETE FROM'
  ];

  let formattedSql = sql;

  keywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    formattedSql = formattedSql.replace(regex, `\n${keyword}`);
  });

  formattedSql = formattedSql.trim();

  return formattedSql;
}

interface WidgetDebugModalProps {
  isOpen: boolean;
  onClose: () => void;
  query: string;
  params: any;
  error: Error | null;
}

export function WidgetDebugModal({ isOpen, onClose, query, params, error }: WidgetDebugModalProps) {
  if (!isOpen) {
    return null;
  }

  const prettyQuery = prettyPrintSql(query);

  return (
    <div className="fixed inset-0 bg-white bg-opacity-50 overflow-y-auto h-full w-full" onClick={onClose}>
      <div className="relative top-20 mx-auto p-5 border w-1/2 shadow-lg rounded-md" onClick={e => e.stopPropagation()}>
        <div className="mt-3 text-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Query Details</h3>
          <div className="mt-2 px-7 py-3">
            {error && (
              <div className="mb-4">
                <p className="text-sm text-red-500">
                  <strong>Error:</strong>
                </p>
                <pre className="bg-red-100 p-2 rounded-md text-left" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}><code>{error.message}</code></pre>
                {error.stack && (
                  <>
                    <p className="text-sm text-red-500 mt-4">
                      <strong>Stack Trace:</strong>
                    </p>
                    <pre className="bg-red-100 p-2 rounded-md text-left" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}><code>{error.stack}</code></pre>
                  </>
                )}
              </div>
            )}
            <p className="text-sm text-gray-500">
              <strong>Query:</strong>
            </p>
            <pre className="bg-gray-100 p-2 rounded-md text-left" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}><code>{prettyQuery}</code></pre>
            <p className="text-sm text-gray-500 mt-4">
              <strong>Parameters:</strong>
            </p>
            <pre className="bg-gray-100 p-2 rounded-md text-left"><code>{JSON.stringify(params, null, 2)}</code></pre>
          </div>
          <div className="items-center px-4 py-3">
            <button
              id="ok-btn"
              className="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
