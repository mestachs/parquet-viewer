import React, { useState, useRef, useEffect } from 'react';

interface ResultsTableProps {
  results: any[];
}

export const ResultsTable: React.FC<ResultsTableProps> = ({ results }) => {
  const [page, setPage] = useState(0);
  const [sliderPage, setSliderPage] = useState(0); // New state for slider's immediate value
  const pageSize = 14;

  const tableContainerRef = useRef<HTMLDivElement>(null); // Ref for the scrollable container

  if (!results || results.length === 0) {
    return <div className="small text-gray-500 mt-4">No rows</div>;
  }

  const cols = Object.keys(results[0]);
  const pageCount = Math.ceil(results.length / pageSize);

  // Effect to update sliderPage when page changes (e.g., via Prev/Next buttons)
  useEffect(() => {
    setSliderPage(page);
  }, [page]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevPage = () => {
    handlePageChange(Math.max(0, page - 1));
  };

  const handleNextPage = () => {
    handlePageChange(Math.min(pageCount - 1, page + 1));
  };

  // Debounce logic using useEffect
  useEffect(() => {
    const handler = setTimeout(() => {
      // Only update the actual page if sliderPage is different from current page
      // This prevents unnecessary re-renders if the slider is moved but lands on the same page
      if (sliderPage !== page) {
        handlePageChange(sliderPage);
      }
    }, 200); // 200ms debounce time

    return () => {
      clearTimeout(handler);
    };
  }, [sliderPage, page]); // Re-run effect when sliderPage or page changes

  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSliderPage(Number(event.target.value)); // Update slider's visual position immediately
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
      <div className="flex items-center space-x-2">
        <label htmlFor="pageSlider" className="text-sm text-gray-700">Page:</label>
        <input
          id="pageSlider"
          type="range"
          min="0"
          max={pageCount > 0 ? pageCount - 1 : 0}
          value={sliderPage}
          onChange={handleSliderChange}
          className="w-64"
        />
        <span className="text-sm text-gray-700">
          {page + 1} of {pageCount}
        </span>
      </div>
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
      <div ref={tableContainerRef} className="overflow-x-auto" style={{ maxHeight: '500px', overflowY: 'auto' }}>
        <table className="min-w-full divide-y divide-gray-200 shadow-sm border border-gray-200">
          <thead className="bg-gray-50 sticky top-0">
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