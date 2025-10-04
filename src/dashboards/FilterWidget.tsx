import { useEffect, useState, useCallback } from "react";
import { useDuckDB } from "./DuckDBProvider";

export function FilterWidget({ config, onFilterChange, filters }) {
  const { db } = useDuckDB();
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState<string[]>([]);

  // Effect to fetch options
  useEffect(() => {
    console.log(`FilterWidget ${config.id} useEffect (fetchOptions) running. Filters:`, filters);
    if (!db) return;

    const fetchOptions = async () => {
      const conn = await db.connect();
      let query = `SELECT DISTINCT ${config.source.column} FROM ${config.source.dataSource}`;
      let params: any[] = [];

      if (
        config.dependsOn &&
        filters[config.dependsOn] &&
        filters[config.dependsOn].length > 0
      ) {
        const dependencyValues = filters[config.dependsOn];
        const placeholders = dependencyValues.map(() => '?').join(', ');
        query += ` WHERE ${config.dependsOn} IN (${placeholders})`;
        params = dependencyValues;
      }

      const stmt = await conn.prepare(query);
      const result = await stmt.query(...params);
      const opts = result.toArray().map((row) => row[config.source.column]);
      setOptions(opts);
      console.log(`FilterWidget ${config.id} fetched options:`, opts);
    };

    fetchOptions();
  }, [db, config, filters]); // Removed onFilterChange from dependencies

  // Effect to synchronize internal selected state with parent filters prop
  useEffect(() => {
    const parentSelected = filters[config.id] || [];
    // Only update if the parent's selected state is different from current internal state
    if (selected.length !== parentSelected.length || selected.some((val, i) => val !== parentSelected[i])) {
      console.log(`FilterWidget ${config.id} synchronizing selected from parent. Parent:`, parentSelected, "Current:", selected);
      setSelected(parentSelected);
    }
  }, [filters, config.id, selected]); // Added selected to dependencies to prevent infinite loop

  // Effect to clear invalid selections and notify parent
  useEffect(() => {
    if (options.length > 0 && selected.length > 0) {
      const newSelected = selected.filter(s => options.includes(s));
      if (newSelected.length !== selected.length) {
        console.log(`FilterWidget ${config.id} clearing invalid selections. New selected:`, newSelected);
        setSelected(newSelected);
        onFilterChange(config.id, newSelected);
      }
    }
  }, [options, selected, config.id, onFilterChange]);

  console.log(`FilterWidget ${config.id} rendering. Selected:`, selected);

  const handleChange = useCallback((e) => {
    const selectedOptions = Array.from(
      e.target.selectedOptions,
      (option) => option.value
    );
    console.log(`FilterWidget ${config.id} handleChange. Selected options:`, selectedOptions);
    setSelected(selectedOptions);
    onFilterChange(config.id, selectedOptions);
  }, [config.id, onFilterChange]);

  return (
    <div className="p-4 border rounded-2xl bg-gray-50">
      <label className="block text-sm font-medium mb-2">{config.label}</label>
      <select
        multiple
        onChange={handleChange}
        value={selected}
        className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
