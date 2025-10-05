import { createContext, useContext, useState, useCallback } from "react";
import { useDuckDb } from "duckdb-wasm-kit";
import { AsyncDuckDB } from "@duckdb/duckdb-wasm";

interface DuckDBContextType {
  db: AsyncDuckDB | null;
  tableVersion: number;
  refreshTables: () => void;
}

const DuckDBContext = createContext<DuckDBContextType | null>(null);

export function DuckDBProvider({ children }: { children: React.ReactNode }) {
  const { db } = useDuckDb();
  const [tableVersion, setTableVersion] = useState(0);

  const refreshTables = useCallback(() => setTableVersion(v => v + 1), []);

  return (
    <DuckDBContext.Provider value={{ db, tableVersion, refreshTables }}>
      {children}
    </DuckDBContext.Provider>
  );
}

export function useDuckDB() {
  const context = useContext(DuckDBContext);
  if (!context) {
    throw new Error("useDuckDB must be used within a DuckDBProvider");
  }
  return context;
}
