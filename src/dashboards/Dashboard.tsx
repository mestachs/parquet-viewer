import React, { useState, useMemo, useEffect } from "react";
import { useDuckDB } from "./DuckDBProvider";
import { DashboardRenderer } from "./DashboardRenderer";
import type { SupersetFilter } from "./supersetModel";
import { useSearchParams } from "react-router-dom";

export function OrgUnitDashboard({ dashboardName }: { dashboardName: string }) {
  const { tableVersion } = useDuckDB();
  const [searchParams, setSearchParams] = useSearchParams();
  const [rawFilters, setRawFilters] = useState<Record<string, any[]>>(() => {
    const filters: Record<string, any[]> = {};
    for (const [key, value] of searchParams.entries()) {
      filters[key] = value.split(",");
    }
    return filters;
  });
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    fetch(`./dashboards/${dashboardName}.json`)
      .then((response) => response.json())
      .then((data) => setConfig(data));
  }, [dashboardName]);

  useEffect(() => {
    const newSearchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(rawFilters)) {
      if (value && value.length > 0) {
        newSearchParams.set(key, value.join(","));
      }
    }
    setSearchParams(newSearchParams);
  }, [rawFilters, setSearchParams]);

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

  if (!config) {
    return <div>Loading...</div>;
  }

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
