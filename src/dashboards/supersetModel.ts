export interface SupersetFilter {
    subject: string
    operator: string
    comparator?: any
  }
  
  export interface SupersetMetric {
    label: string
    sqlExpression?: string
  }
  
  export interface SupersetParams {
    dataSource: string
    queryMode?: string
    groupBy?: string[]
    metrics?: (string | SupersetMetric)[]
    adhocFilters?: SupersetFilter[]
    rowLimit?: number
    columns?: { column: string; label?: string }[];
    customSql?: string[];
  }
  
  export interface SupersetWidgetConfig {
    sliceName: string
    vizType: 'table' | 'keyNumber' | 'chart'
    params: SupersetParams
  }
  