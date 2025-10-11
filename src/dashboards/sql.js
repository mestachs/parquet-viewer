import nunjucks from "nunjucks";

function normalizeSql(sql) {
    return sql
      .replace(/\s+/g, " ") // collapse all whitespace/newlines
      .trim();              // remove leading/trailing spaces
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

  function compile(template, context = {}) {
    params.length = 0;
    const text = env.renderString(template, context);
    return { sql: normalizeSql(text), params: [...params] };
  }

  return { env, compile };
}
