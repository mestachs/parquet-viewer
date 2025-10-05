
import { useEffect, useState, useMemo } from 'react';
import { QueryModel } from './QueryModel';
import { useDuckDB } from './DuckDBProvider';
import type { SupersetWidgetConfig, SupersetFilter } from './supersetModel';

export function useQueryModel(config: SupersetWidgetConfig, filters: SupersetFilter[]) {
  const { db, tableVersion } = useDuckDB();
  const [data, setData] = useState<any[]>([]);
  const [query, setQuery] = useState<string | null>(null);
  const [params, setParams] = useState<any[] | null>(null);

  const qm = useMemo(() => {
    if (!db) return null;
    return new QueryModel(db, config, filters);
  }, [db, config, filters]);

  useEffect(() => {
    if (!qm) return;

    const { sql, params } = qm.buildSQL();
    setQuery(sql);
    setParams(params);

    qm.execute().then(rows => {
      setData(rows);
    });
  }, [qm, tableVersion]);

  return { data, query, params };
}
