import React, { useCallback, Suspense, lazy } from "react";
import { ParquetUploadWidget } from "./ParquetUploadWidget";
import { FilterWidget } from "./FilterWidget";
import { useDuckDB } from "./DuckDBProvider";
import { WidgetLoader } from "./WidgetLoader";
import type { SupersetFilter } from "./supersetModel";

const widgetMap: Record<string, React.LazyExoticComponent<any>> = {
  keyNumber: lazy(() => import("./KeyNumberWidget").then(module => ({ default: module.KeyNumberWidget }))),
  table: lazy(() => import("./TableWidget").then(module => ({ default: module.TableWidget }))),
  map: lazy(() => import("./MapWidget").then(module => ({ default: module.MapWidget }))),
  bar_chart: lazy(() => import("./BarWidget").then(module => ({ default: module.BarWidget }))),
};

interface DashboardRendererProps {
  config: any;
  rawFilters: Record<string, any[]>;
  supersetFilters: SupersetFilter[];
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
  rawFilters,
  supersetFilters,
  onFilterChange,
  disableMap = false,
}: DashboardRendererProps) => {
  const handleFileRegistered = useCallback(() => {
    // Clear all filters
    for (const filterConfig of config.filters) {
      onFilterChange(filterConfig.id, []);
    }
  }, [config.filters, onFilterChange]);

  const renderLayoutItem = useCallback((item: any): React.ReactNode => {
    switch (item.type) {
      case "ParquetUploadWidget":
        return <ParquetUploadWidget key="upload" className={item.className} defaultUrl={item.defaultUrl} onFileRegistered={handleFileRegistered} />;

      case "Filters":
        return (
          <div key="filters" className={item.className}>
            {config.filters.map((f: any) => (
              <FilterWidget
                key={"filter-"+f.id}
                config={f}
                filters={rawFilters}
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
        console.log("DashboardRenderer - widgetConfig.params.groupBy:", widgetConfig.params.groupBy);

        const LazyWidgetComp = widgetMap[widgetConfig.type];
        if (!LazyWidgetComp) {
          throw new Error(
            "no widget for " + item.widgetKey + " " + widgetConfig.type
          );
        }

        return (
          <Suspense fallback={<div>Loading Widget...</div>} key={item.widgetKey}>
            <WidgetLoader
              config={widgetConfig}
              filters={supersetFilters}
              WidgetComponent={LazyWidgetComp}
            />
          </Suspense>
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
  }, [config, rawFilters, supersetFilters, onFilterChange, disableMap, handleFileRegistered]); // Add handleFileRegistered to dependencies

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
