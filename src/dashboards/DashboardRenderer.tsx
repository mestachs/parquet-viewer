import React, { useCallback } from "react";
import { ParquetUploadWidget } from "./ParquetUploadWidget";
import { KeyNumberWidget } from "./KeyNumberWidget";
import { TableWidget } from "./TableWidget";
import { MapWidget } from "./MapWidget";
import { FilterWidget } from "./FilterWidget";
import { useDuckDB } from "./DuckDBProvider";

const widgetMap: Record<string, any> = {
  keyNumber: KeyNumberWidget,
  table: TableWidget,
  map: MapWidget,
};

interface DashboardRendererProps {
  config: any;
  filters: any[];
  onFilterChange: (id: string, value: any) => void;
  disableMap?: boolean;
}

interface HideIfNoParquetProps {
  children: React.ReactNode;
  itemKey: string; // Add itemKey prop
}

export function HideIfNoParquet({ children, itemKey }: HideIfNoParquetProps) {
  const { tableVersion } = useDuckDB();

  if (tableVersion > 0) {
    return <div key={itemKey}>{children}</div>; // Use itemKey here
  }
  return <div key={itemKey}></div>; // Use itemKey here
}

export const DashboardRenderer = React.memo(({
  config,
  filters,
  onFilterChange,
  disableMap = false,
}: DashboardRendererProps) => {
  const renderLayoutItem = useCallback((item: any): React.ReactNode => {
    switch (item.type) {
      case "ParquetUploadWidget":
        return <ParquetUploadWidget key="upload" className={item.className} />;

      case "Filters":
        return (
          <div key="filters" className={item.className}>
            {config.filters.map((f: any) => (
              <FilterWidget
                key={"filter-"+f.id}
                config={f}
                filters={filters}
                onFilterChange={onFilterChange}
              />
            ))}
          </div>
        );

      case "Widget":
      case "ConditionalWidget": {
        if (item.type === "ConditionalWidget") {
          if (item.invertCondition ? disableMap : !disableMap) return null;
        }

        const widgetConfig = config.widgets[item.widgetKey];
        if (!widgetConfig) {
          throw new Error("no widget key for " + item.widgetKey);
        }

        const WidgetComp = widgetMap[widgetConfig.type];
        if (!WidgetComp) {
          throw new Error(
            "no widget for " + item.widgetKey + " " + widgetConfig.type
          );
        }

        return (
          <div key={item.widgetKey} className={item.className}>
            <WidgetComp config={widgetConfig} filters={filters} />
          </div>
        );
      }

      case "Container":
        return (
          <div key={item.key || item.type} className={item.className}> {/* Use item.type as fallback for key */}
            {item.children?.map((c: any) => renderLayoutItem(c))}
          </div>
        );

      default:
        return null;
    }
  }, [config, filters, onFilterChange, disableMap]); // Add all dependencies

  return (
    <div className="space-y-4 p-4">
      {config.layout?.map((item: any) =>
        item.type == "ParquetUploadWidget" ? (
          renderLayoutItem(item)
        ) : (
          <HideIfNoParquet key={item.key || item.type} itemKey={item.key || item.type}> {/* Pass itemKey */}
            {renderLayoutItem(item)}
          </HideIfNoParquet>
        )
      )}
    </div>
  );
});
