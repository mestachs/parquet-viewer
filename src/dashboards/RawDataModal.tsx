import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

interface RawDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any[];
}

export function RawDataModal({ isOpen, onClose, data }: RawDataModalProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    if (isOpen) {
      setCurrentPage(1);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const totalPages = Math.ceil(data.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentData = data.slice(startIndex, endIndex);
  const headers = data.length > 0 ? Object.keys(data[0]) : [];

  const modalContent = (
    <dialog className="modal modal-open" open={isOpen}>
      <div className="modal-box w-11/12 max-w-5xl">
        <h3 className="font-bold text-lg">Raw Data</h3>
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                {headers.map((header) => (
                  <th key={header}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentData.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {headers.map((header) => (
                    <td key={header}>{String(row[header])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="modal-action">
          <div className="join">
            <button
              className="join-item btn"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              «
            </button>
            <button className="join-item btn">
              Page {currentPage} of {totalPages}
            </button>
            <button
              className="join-item btn"
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
              disabled={currentPage === totalPages}
            >
              »
            </button>
          </div>
          <button className="btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );

  return createPortal(modalContent, document.body);
}
