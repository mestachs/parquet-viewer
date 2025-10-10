import React, { useState, useMemo, useEffect, useRef } from "react";
import { useDuckDB } from "./DuckDBProvider";
import { DashboardRenderer } from "./DashboardRenderer";
import type { SupersetFilter } from "./supersetModel";
import { useSearchParams } from "react-router-dom";
import { ColorContext, palette } from "./ColorContext";
import type { ColorMapping } from "./ColorContext";

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
  const assignedColors = useRef<ColorMapping>({});

  useEffect(() => {
    fetch(`./dashboards/${dashboardName}.json`)
      .then((response) => response.json())
      .then((data) => {
        setConfig(data);
        assignedColors.current = data.colorMapping || {};
      });
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

  const getColor = (group: string, value: string): string => {
    if (assignedColors.current[group]?.[value]) {
      return assignedColors.current[group][value];
    }

    const groupColors = assignedColors.current[group] || {};
    const newColor = palette[Object.keys(groupColors).length % palette.length];
    
    if (!assignedColors.current[group]) {
      assignedColors.current[group] = {};
    }
    assignedColors.current[group][value] = newColor;
    
    return newColor;
  };

  if (!config) {
    return <div>Loading...</div>;
  }

  return (
    <ColorContext.Provider value={{ getColor }}>
      <div className="space-y-4 p-4">
        <DashboardRenderer
          config={config}
          rawFilters={rawFilters}
          supersetFilters={supersetFilters}
          onFilterChange={handleFilterChange}
          disableMap={true} // or false if you want the map
        />
      </div>
    </ColorContext.Provider>
  );
}
