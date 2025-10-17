import React from 'react';

interface ExportMenuItemProps {
  exportHandler: () => void;
  label: string;
  isExporting: boolean;
  exportError: Error | null;
}

export function ExportMenuItem({ exportHandler, label, isExporting, exportError }: ExportMenuItemProps) {
  const title = exportError ? exportError.message : label;
  const isDisabled = !!(isExporting || exportError);

  return (
    <li>
      <a
        onClick={() => !isDisabled && exportHandler()}
        className={isDisabled ? 'disabled' : ''}
        title={title}
      >
        {isExporting && !exportError ? <span className="loading loading-dots loading-xs"></span> : label}
      </a>
    </li>
  );
}
