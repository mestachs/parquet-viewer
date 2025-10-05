import React, { useState, useMemo } from "react";
import config from "./dashboard.json";
import { useDuckDB } from "./DuckDBProvider";
import { DashboardRenderer } from "./DashboardRenderer";
import type { SupersetFilter } from "./supersetModel";

export function OrgUnitDashboard() {
  const { tableVersion } = useDuckDB();
  const [rawFilters, setRawFilters] = useState<Record<string, any[]>>({});

  const handleFilterChange = (filterId: string, selectedOptions: any) => {
    setRawFilters((prev) => ({
      ...prev,
      [filterId]: selectedOptions,
    }));
  };

  const supersetFilters = useMemo(() => {
    return Object.entries(rawFilters)
      .filter(([, comparator]) => comparator && comparator.length > 0)
      .map(([subject, comparator]) => ({
        subject,
        operator: 'IN',
        comparator,
      } as SupersetFilter));
  }, [rawFilters]);

  return (
    <div className="space-y-4 p-4">
      <DashboardRenderer
        config={config}
        rawFilters={rawFilters}
        supersetFilters={supersetFilters}
        onFilterChange={handleFilterChange}
        disableMap={true} // or false if you want the map
      />
    </div>
  );
}
