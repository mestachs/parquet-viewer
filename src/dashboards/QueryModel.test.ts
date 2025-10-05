import { QueryModel } from './QueryModel';
import { SupersetWidgetConfig, SupersetFilter } from './supersetModel';
import { AsyncDuckDB } from '@duckdb/duckdb-wasm';

describe('QueryModel', () => {
  let mockDb: AsyncDuckDB;

  beforeEach(() => {
    mockDb = {} as AsyncDuckDB; // Mock AsyncDuckDB as it's not needed for buildSQL tests
  });

  it('should build a correct SQL query for an aggregate widget', () => {
    const config: SupersetWidgetConfig = {
      sliceName: 'Test Aggregate',
      vizType: 'table',
      params: {
        dataSource: 'my_table',
        queryMode: 'aggregate',
        groupBy: ['column_a', 'column_b'],
        metrics: [
          {
            label: 'COUNT(column_c)',
            sqlExpression: 'COUNT(column_c)',
          },
        ],
        rowLimit: 100,
      },
    };

    const queryModel = new QueryModel(mockDb, config);
    const { sql, params } = queryModel.buildSQL();

    expect(sql).toBe('SELECT column_a, column_b, COUNT(column_c) AS "COUNT(column_c)" FROM my_table GROUP BY column_a, column_b LIMIT 100');
    expect(params).toEqual([]);
  });

  it('should build a correct SQL query for a raw widget', () => {
    const config: SupersetWidgetConfig = {
      sliceName: 'Test Raw',
      vizType: 'table',
      params: {
        dataSource: 'another_table',
        queryMode: 'raw',
        columns: [
          { column: 'col_x', label: 'X Column' },
          { column: 'col_y' },
        ],
        rowLimit: 50,
      },
    };

    const queryModel = new QueryModel(mockDb, config);
    const { sql, params } = queryModel.buildSQL();

    expect(sql).toBe('SELECT col_x AS "X Column", col_y FROM another_table LIMIT 50');
    expect(params).toEqual([]);
  });

  it('should build a correct SQL query with filters', () => {
    const config: SupersetWidgetConfig = {
      sliceName: 'Test Filtered',
      vizType: 'table',
      params: {
        dataSource: 'filtered_table',
        queryMode: 'raw',
        columns: [{ column: 'id' }],
        adhocFilters: [
          { subject: 'status', operator: '=', comparator: 'active' },
        ],
      },
    };
    const filters: SupersetFilter[] = [
      { subject: 'category', operator: 'IN', comparator: ['A', 'B'] },
    ];

    const queryModel = new QueryModel(mockDb, config, filters);
    const { sql, params } = queryModel.buildSQL();

    expect(sql).toBe('SELECT id FROM filtered_table WHERE status = ? AND category IN (?, ?)');
    expect(params).toEqual(['active', 'A', 'B']);
  });

  it('should handle metrics with aggregate and column_name but no sqlExpression', () => {
    const config: SupersetWidgetConfig = {
      sliceName: 'Test Aggregate No SqlExpression',
      vizType: 'table',
      params: {
        dataSource: 'my_table',
        queryMode: 'aggregate',
        groupBy: ['column_a'],
        metrics: [
          {
            label: 'COUNT(column_c)',
            aggregate: 'COUNT',
            column: { column_name: 'column_c' },
          },
        ],
      },
    };

    const queryModel = new QueryModel(mockDb, config);
    const { sql, params } = queryModel.buildSQL();

    expect(sql).toBe('SELECT column_a, COUNT(column_c) AS "COUNT(column_c)" FROM my_table GROUP BY column_a');
    expect(params).toEqual([]);
  });

  it('should handle empty metrics in aggregate mode by selecting groupBy columns', () => {
    const config: SupersetWidgetConfig = {
      sliceName: 'Test Empty Metrics',
      vizType: 'table',
      params: {
        dataSource: 'my_table',
        queryMode: 'aggregate',
        groupBy: ['column_a', 'column_b'],
        metrics: [],
      },
    };

    const queryModel = new QueryModel(mockDb, config);
    const { sql, params } = queryModel.buildSQL();

    expect(sql).toBe('SELECT column_a, column_b FROM my_table GROUP BY column_a, column_b');
    expect(params).toEqual([]);
  });

  it('should handle raw query with no columns by selecting all', () => {
    const config: SupersetWidgetConfig = {
      sliceName: 'Test Raw No Columns',
      vizType: 'table',
      params: {
        dataSource: 'my_table',
        queryMode: 'raw',
      },
    };

    const queryModel = new QueryModel(mockDb, config);
    const { sql, params } = queryModel.buildSQL();

    expect(sql).toBe('SELECT * FROM my_table');
    expect(params).toEqual([]);
  });

  it('should build correct SQL for BarWidget configuration', () => {
    const config: SupersetWidgetConfig = {
      label: "Orgunit by Type per level 2",
      vizType: "bar_chart",
      params: {
        dataSource: "orgunits",
        viz_type: "bar_chart",
        queryMode: "aggregate",
        x_axis: {
          column: "org_unit_level_2_name",
          sort_series: "name",
          sort_series_ascending: true,
          title: {
            label: "",
            margin: 15
          }
        },
        metrics: [
          {
            aggregate: "COUNT",
            column: {
              column_name: "org_unit_type_name",
              filterable: true,
              groupby: true,
              type: "TEXT"
            },
            expressionType: "SIMPLE",
            hasCustomLabel: false,
            label: "COUNT(org_unit_type_name)",
            sqlExpression: null
          }
        ],
        groupBy: [
          "org_unit_level_2_name",
          "org_unit_type_name"
        ],
        rowLimit: 10000,
        y_axis_title: "",
        y_axis_title_margin: 15,
        y_axis_title_position: "Left",
        sort_series_type: "sum",
        color_scheme: "colorsOfRainbow",
        show_value: false,
        stack: "Stack",
        only_total: true,
        show_legend: true,
        legendType: "scroll",
        legendOrientation: "top",
        x_axis_time_format: "smart_date",
        xAxisLabelRotation: 90
      }
    };

    const queryModel = new QueryModel(mockDb, config);
    const { sql, params } = queryModel.buildSQL();

    expect(sql).toBe('SELECT org_unit_level_2_name, org_unit_type_name, COUNT(org_unit_type_name) AS "COUNT(org_unit_type_name)" FROM orgunits GROUP BY org_unit_level_2_name, org_unit_type_name LIMIT 10000');
    expect(params).toEqual([]);
  });
});
