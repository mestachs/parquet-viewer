import type { SupersetWidgetConfig, SupersetFilter } from "./supersetModel";
import { AsyncDuckDB } from "@duckdb/duckdb-wasm";

export class QueryModel {
  private config: SupersetWidgetConfig;
  private filters: SupersetFilter[];
  private db: AsyncDuckDB;

  constructor(db: AsyncDuckDB, config: SupersetWidgetConfig, filters?: SupersetFilter[]) {
    this.db = db
    this.config = config
    console.log("QueryModel constructor - incoming filters:", filters);
    this.filters = Array.isArray(filters) ? filters : [];
    console.log("QueryModel constructor - this.filters after assignment:", this.filters);
  }

  buildSQL(): { sql: string; params: any[] } {
    const p = this.config.params;
    const table = p.dataSource.split("__")[0];
    const isAgg = p.queryMode === "aggregate";
    const selectParts: string[] = [];

    if (isAgg) {
      if (p.groupBy?.length) {
        selectParts.push(...p.groupBy);
      }
      for (const m of p.metrics ?? []) {
        if (typeof m === 'string') selectParts.push(m)
        else if (m.sqlExpression && m.label)
          selectParts.push(`${m.sqlExpression} AS "${m.label}"`);
        else if (m.aggregate && typeof m.column !== 'string' && m.column?.column_name && m.label) {
          // Handle metrics with aggregate and column_name but no sqlExpression
          selectParts.push(`${m.aggregate}(${m.column.column_name}) AS "${m.label}"`);
        }
      }
    } else {
      // Raw query mode
      if (p.columns && p.columns.length > 0) {
        const cols = p.columns.map((col) => {
          return col.label ? `${col.column} AS "${col.label}"` : col.column;
        });
        selectParts.push(cols.join(", "));
      } else {
        selectParts.push("*");
      }
    }

    if (selectParts.length === 0 && p.groupBy?.length) {
      // If no metrics were added but there are groupBy columns, select them
      selectParts.push(...p.groupBy);
    } else if (selectParts.length === 0) {
      // Fallback if nothing was selected
      selectParts.push("*");
    }

    let sql = `SELECT ${selectParts.join(", ")} FROM ${table}`;
    let allParams: any[] = [];

    const adhocFilters = p.adhocFilters ?? [];
    const dynamicFilters: SupersetFilter[] = [];
    for (const f of this.filters) {
      if (
        f.comparator &&
        Array.isArray(f.comparator) &&
        f.comparator.length === 0
      ) {
        // Skip filters with empty comparator arrays
        continue;
      }
      dynamicFilters.push(f);
    }

    const allFilters = [...adhocFilters, ...dynamicFilters];
    const whereClauses: string[] = [];
    for (const f of allFilters) {
      const filterResult = this.filterToSQL(f);
      if (filterResult) {
        whereClauses.push(filterResult.sql);
        allParams = allParams.concat(filterResult.params);
      }
    }

    if (whereClauses.length) sql += ` WHERE ${whereClauses.join(" AND ")}`;

    if (isAgg && p.groupBy?.length) sql += ` GROUP BY ${p.groupBy.join(", ")}`;

    if (p.rowLimit) sql += ` LIMIT ${p.rowLimit}`;

    return { sql, params: allParams };
  }

  private filterToSQL(
    f: SupersetFilter
  ): { sql: string; params: any[] } | null {
    if (f.operator === "IN" && Array.isArray(f.comparator)) {
      const placeholders = f.comparator.map(() => "?").join(", ");
      return { sql: `${f.subject} IN (${placeholders})`, params: f.comparator };
    }
    if (f.operator === "=") {
      return { sql: `${f.subject} = ?`, params: [f.comparator] };
    }
    return null;
  }

  async execute(): Promise<any[]> {
    const conn = await this.db.connect();
    const table = this.config.params.dataSource.split("__")[0];

    try {
      // Check if table exists
      const tableExistsResult = await conn.query(
        `SELECT 1 FROM information_schema.tables WHERE table_name = '${table}'`
      );
      if (tableExistsResult.numRows === 0) {
        console.warn(`Table '${table}' does not exist.`);
        return [];
      }

      const { sql, params } = this.buildSQL();
      console.log(this.config.label, "executing query " + sql, params);
      const stmt = await conn.prepare(sql);
      const res = await stmt.query(...params);
      return res.toArray();
    } catch (error) {
      console.error("Error executing query:", error);
      return [];
    } finally {
      await conn.close();
    }
  }
}
