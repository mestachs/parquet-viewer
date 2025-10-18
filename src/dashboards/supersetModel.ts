export type SupersetExpressionType = "Simple" | "SQL";

export interface SupersetFilterBase {
  expressionType: SupersetExpressionType;
}

export interface SupersetSimpleFilter extends SupersetFilterBase {
  expressionType: "Simple";
  subject: string;
  operator: string;
  comparator?: any;
}

export interface SupersetSQLFilter extends SupersetFilterBase {
  expressionType: "SQL";
  sqlExpression: string;
}

export type SupersetFilter = SupersetSimpleFilter | SupersetSQLFilter;

export interface SupersetMetric {
  label: string;
  sqlExpression?: string;
}

export interface SupersetParams {
  dataSource: string;
  queryMode?: string;
  groupBy?: string[];
  metrics?: (string | SupersetMetric)[];
  adhocFilters?: SupersetFilter[];
  rowLimit?: number;
  columns?: { column: string; label?: string }[];
  customSql?: string[];
}

export interface SupersetWidgetConfig {
  sliceName: string;
  vizType: "table" | "keyNumber" | "chart";
  params: SupersetParams;
}
