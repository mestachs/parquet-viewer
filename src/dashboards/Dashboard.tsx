import React, { useState, useMemo } from "react";
import config from "./dashboard.json";
import { useDuckDB } from "./DuckDBProvider";
import { DashboardRenderer } from "./DashboardRenderer";

export function OrgUnitDashboard() {
  const { tableVersion } = useDuckDB();
  const [rawFilters, setRawFilters] = useState({});

  const handleFilterChange = (filterId: string, selectedOptions: any) => {
    setRawFilters((prev) => ({
      ...prev,
      [filterId]: selectedOptions,
    }));
  };

  const memoizedFilters = useMemo(() => rawFilters, [rawFilters]);

  return (
    <div className="space-y-4 p-4">
      <DashboardRenderer
        config={config}
        filters={memoizedFilters}
        onFilterChange={handleFilterChange}
        disableMap={true} // or false if you want the map
      />
    </div>
  );
}
