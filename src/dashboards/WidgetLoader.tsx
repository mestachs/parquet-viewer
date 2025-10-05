
import React from 'react';
import { useQueryModel } from './useQueryModel';
import { WidgetContainer } from './WidgetContainer';
import type { SupersetWidgetConfig, SupersetFilter } from './supersetModel';

interface WidgetLoaderProps {
  config: SupersetWidgetConfig;
  filters: SupersetFilter[];
  WidgetComponent: React.LazyExoticComponent<any>;
}

export function WidgetLoader({ config, filters, WidgetComponent }: WidgetLoaderProps) {
  const { data, query, params } = useQueryModel(config, filters);
  console.log("WidgetLoader - config.params.groupBy:", config.params.groupBy);

  return (
    <WidgetContainer config={config} filters={filters} query={query} params={params}>
      <WidgetComponent config={config} filters={filters} data={data} />
    </WidgetContainer>
  );
}
