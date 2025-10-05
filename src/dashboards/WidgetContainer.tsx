
import React, { useState } from 'react';
import { WidgetDebugModal } from './WidgetDebugModal';
import type { SupersetWidgetConfig, SupersetFilter } from './supersetModel';

interface WidgetContainerProps {
  children: React.ReactNode;
  config: SupersetWidgetConfig;
  filters: SupersetFilter[];
  query: string | null;
  params: any[] | null;
}

export function WidgetContainer({ children, config, filters, query, params }: WidgetContainerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="relative">
      {children}
      <button
        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        onClick={() => setIsModalOpen(true)}
      >
        ...
      </button>
      <WidgetDebugModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        query={query || ''}
        params={params || []}
      />
    </div>
  );
}
