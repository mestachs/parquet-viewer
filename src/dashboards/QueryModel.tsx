import { SupersetWidgetConfig, SupersetFilter } from './supersetModel'
import { AsyncDuckDB } from '@duckdb/duckdb-wasm'

export class QueryModel {
  private config: SupersetWidgetConfig
  private filters: SupersetFilter[]
  private db: AsyncDuckDB

  constructor(db: AsyncDuckDB, config: SupersetWidgetConfig, filters: SupersetFilter[] = []) {
    this.db = db
    this.config = config
    this.filters = filters
  }

  buildSQL(): { sql: string, params: any[] } {
    const p = this.config.params
    const table = p.dataSource.split('__')[0]
    const isAgg = p.queryMode === 'aggregate'
    const selectParts: string[] = []

    if (isAgg) {
      for (const m of p.metrics ?? []) {
        if (typeof m === 'string') selectParts.push(m)
        else if (m.sqlExpression && m.label)
          selectParts.push(`${m.sqlExpression} AS "${m.label}"`)
      }
      if (p.groupBy?.length) selectParts.unshift(...p.groupBy)
    } else {
      // Raw query mode
      if (p.columns && p.columns.length > 0) {
        const cols = p.columns.map(col => {
          return col.label ? `${col.column} AS "${col.label}"` : col.column;
        });
        selectParts.push(cols.join(', '))
      } else {
        selectParts.push('*')
      }
    }

    let sql = `SELECT ${selectParts.join(', ')} FROM ${table}`
    let allParams: any[] = []

    const adhocFilters = p.adhocFilters ?? []
    const dynamicFilters: SupersetFilter[] = Object.entries(this.filters).flatMap(([key, values]) => {
      if (values.length > 0) {
        return [{
          subject: key,
          operator: 'IN',
          comparator: values,
          clause: 'WHERE',
          expressionType: 'SQL',
        }]
      }
      return []
    })

    const allFilters = [...adhocFilters, ...dynamicFilters]
    const whereClauses: string[] = []
    for (const f of allFilters) {
      const filterResult = this.filterToSQL(f);
      if (filterResult) {
        whereClauses.push(filterResult.sql);
        allParams = allParams.concat(filterResult.params);
      }
    }

    if (whereClauses.length) sql += ` WHERE ${whereClauses.join(' AND ')}`

    if (isAgg && p.groupBy?.length)
      sql += ` GROUP BY ${p.groupBy.join(', ')}`

    if (p.rowLimit)
      sql += ` LIMIT ${p.rowLimit}`

    return { sql, params: allParams }
  }

  private filterToSQL(f: SupersetFilter): { sql: string, params: any[] } | null {
    if (f.operator === 'IN' && Array.isArray(f.comparator)) {
      const placeholders = f.comparator.map(() => '?').join(', ');
      return { sql: `${f.subject} IN (${placeholders})`, params: f.comparator };
    }
    if (f.operator === '=') {
      return { sql: `${f.subject} = ?`, params: [f.comparator] };
    }
    return null;
  }

  async execute(): Promise<any[]> {
    const conn = await this.db.connect()
    const table = this.config.params.dataSource.split('__')[0]

    try {
      // Check if table exists
      const tableExistsResult = await conn.query(`SELECT 1 FROM information_schema.tables WHERE table_name = '${table}'`);
      if (tableExistsResult.numRows === 0) {
        console.warn(`Table '${table}' does not exist.`);
        return [];
      }

      const { sql, params } = this.buildSQL()
      const stmt = await conn.prepare(sql);
      const res = await stmt.query(...params);
      return res.toArray()
    } catch (error) {
      console.error("Error executing query:", error);
      return [];
    } finally {
      await conn.close()
    }
  }
}
