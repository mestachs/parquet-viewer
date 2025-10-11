import nunjucks from "nunjucks";

function normalizeSql(sql) {
    return sql
      .replace(/\s+/g, " ") // collapse all whitespace/newlines
      .trim();              // remove leading/trailing spaces
  }

function filterToSQL(f) {
  if (f.operator === "IN" && Array.isArray(f.comparator)) {
    const placeholders = f.comparator.map(() => "?").join(", ");
    return { sql: `${f.subject} IN (${placeholders})`, params: f.comparator };
  }
  if (f.operator === "=") {
    return { sql: `${f.subject} = ?`, params: [f.comparator] };
  }
  return null;
}

export function createJinjaSQL(envOptions = {}) {
  const env = new nunjucks.Environment(null, envOptions);
  const params = [];

  env.addFilter("sql_list", (arr) => {
    if (!Array.isArray(arr) || arr.length === 0) return "(NULL)";
    arr.forEach((v) => params.push(v));
    return arr.map(() => "?").join(", ");
  });

  env.addExtension(
    "ParamExtension",
    new (class {
      constructor() {
        this.tags = ["param"];
      }

      parse(parser, nodes) {
        const tok = parser.nextToken();
        const args = parser.parseSignature(true, true);
        parser.advanceAfterBlockEnd(tok.value);
        return new nodes.CallExtension(this, "run", args);
      }

      run(context, value) {
        params.push(value);
        return new nunjucks.runtime.SafeString("?");
      }
    })()
  );

  env.addExtension(
    "AllFiltersExtension",
    new (class {
      constructor() {
        this.tags = ["all_filters"];
      }

      parse(parser, nodes) {
        const tok = parser.nextToken();
        parser.advanceAfterBlockEnd(tok.value);
        return new nodes.CallExtension(this, "run");
      }

      run(context) {
        const filters = context.ctx.filters || [];
        const whereClauses = [];
        const allParams = [];
        for (const f of filters) {
          const filterResult = filterToSQL(f);
          if (filterResult) {
            whereClauses.push(filterResult.sql);
            allParams.push(...filterResult.params);
          }
        }
        params.push(...allParams);
        if (whereClauses.length > 0) {
          return new nunjucks.runtime.SafeString(whereClauses.join(" AND "));
        }
        return "1=1";
      }
    })()
  );

  function compile(template, context = {}) {
    params.length = 0;
    const text = env.renderString(template, context);
    return { sql: normalizeSql(text), params: [...params] };
  }

  return { env, compile };
}
