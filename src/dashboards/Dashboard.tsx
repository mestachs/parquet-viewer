import React, { useState, useMemo, useEffect, useRef } from "react";
import { useDuckDB } from "./DuckDBProvider";
import { DashboardRenderer } from "./DashboardRenderer";
import type { SupersetFilter } from "./supersetModel";
import { useSearchParams } from "react-router-dom";
import { ColorContext, palette } from "./ColorContext";
import type { ColorMapping } from "./ColorContext";

function findNodes(layout: any[], predicate: (node: any) => boolean): any[] {
  const results: any[] = [];
  function recurse(items: any[]) {
    if (!items) return;
    for (const item of items) {
      if (predicate(item)) {
        results.push(item);
      }
      if (item.children) {
        recurse(item.children);
      }
    }
  }
  recurse(layout);
  return results;
}


export function OrgUnitDashboard({ dashboardName }: { dashboardName: string }) {
  const { tableVersion } = useDuckDB();
  const [searchParams, setSearchParams] = useSearchParams();
  const [config, setConfig] = useState<any>(null);
  const assignedColors = useRef<ColorMapping>({});

  const filterKeys = useMemo(() => config ? new Set(config.filters.map((f: any) => f.id)) : new Set(), [config]);

  const [rawFilters, setRawFilters] = useState<Record<string, any[]>>(() => {
    const initialFilters: Record<string, any[]> = {};
    if (config) {
      const filterKeys = new Set(config.filters.map((f: any) => f.id));
      for (const [key, value] of searchParams.entries()) {
        if (filterKeys.has(key)) {
          initialFilters[key] = value.split(",");
        }
      }
    }
    return initialFilters;
  });


  useEffect(() => {
    fetch(`./dashboards/${dashboardName}.json`)
      .then((response) => response.json())
      .then((data) => {
        setConfig(data);
        assignedColors.current = data.colorMapping || {};
      });
  }, [dashboardName]);

  useEffect(() => {
    if (!config) return;
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      for (const key of filterKeys) {
        const value = rawFilters[key];
        if (value && value.length > 0) {
          newParams.set(key, value.join(","));
        } else {
          newParams.delete(key);
        }
      }
      return newParams;
    });
  }, [rawFilters, filterKeys, config, setSearchParams]);

  const handleFilterChange = (filterId: string, selectedOptions: any) => {
    setRawFilters((prev) => ({
      ...prev,
      [filterId]: selectedOptions,
    }));
  };

  const handleTabChange = (widgetKey: string, tabId: string) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set(widgetKey, tabId);
      return newParams;
    });
  };

  const activeTabs = useMemo(() => {
    const tabs: Record<string, string> = {};
    if (config) {
      const tabContainers = findNodes(config.layout, node => node.widgetKey === 'tabs');
      for (const container of tabContainers) {
        const widgetKey = container.widgetKey;
        const defaultValue = container.children?.[0]?.id;
        if (defaultValue) {
          tabs[widgetKey] = searchParams.get(widgetKey) || defaultValue;
        }
      }
    }
    return tabs;
  }, [config, searchParams]);


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
          onTabChange={handleTabChange}
          activeTabs={activeTabs}
          disableMap={true} // or false if you want the map
        />
      </div>
    </ColorContext.Provider>
  );
}