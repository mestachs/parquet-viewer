import { createJinjaSQL } from "./sql";

const { compile } = createJinjaSQL();

describe("createJinjaSQL", () => {
  it("render sql ", () => {
    const template = `
            SELECT * FROM users
            WHERE id = {% param user.id %}
            {% if roles %}
                AND role IN ({{ roles | sql_list }})
            {% endif %}
    `;

    const ctx = { user: { id: 42 }, roles: ["admin", "editor"] };

    expect(compile(template, ctx)).toEqual({
      params: [42, "admin", "editor"],
      sql: "SELECT * FROM users WHERE id = ? AND role IN (?, ?)",
    });
  });
});
