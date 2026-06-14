import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { internal } from "../_generated/api";
import schema from "../schema";

describe("importFromRows", () => {
  it("MIG-004: import invalid email returns invalid: 1", async () => {
    const t = convexTest(schema);
    const result = await t.mutation(internal.migrations.importLeads.importFromRows, {
      rows: [
        {
          name: "Bad Email",
          email: "not-an-email",
          description: "Should not insert.",
        },
      ],
    });
    expect(result).toEqual({ inserted: 0, skipped: 0, invalid: 1 });
    const leads = await t.run(async (ctx) => ctx.db.query("leads").collect());
    expect(leads).toHaveLength(0);
  });

  it("MIG-005: duplicate rows without supabaseId both insert", async () => {
    const t = convexTest(schema);
    const row = {
      name: "Legacy Lead",
      email: "legacy-dup@example.com",
      description: "No supabaseId — no dedup key.",
    };
    const first = await t.mutation(internal.migrations.importLeads.importFromRows, {
      rows: [row],
    });
    const second = await t.mutation(internal.migrations.importLeads.importFromRows, {
      rows: [row],
    });
    expect(first).toEqual({ inserted: 1, skipped: 0, invalid: 0 });
    expect(second).toEqual({ inserted: 1, skipped: 0, invalid: 0 });
    const leads = await t.run(async (ctx) => ctx.db.query("leads").collect());
    expect(leads).toHaveLength(2);
  });

  it("MIG-003: skips duplicate supabaseId on re-import", async () => {
    const t = convexTest(schema);
    const rows = [
      {
        name: "Legacy Lead",
        email: "legacy@example.com",
        description: "Imported once.",
        supabaseId: "sb-123",
        createdAt: 1_700_000_000_000,
      },
    ];
    const first = await t.mutation(internal.migrations.importLeads.importFromRows, {
      rows,
    });
    expect(first).toEqual({ inserted: 1, skipped: 0, invalid: 0 });
    const second = await t.mutation(internal.migrations.importLeads.importFromRows, {
      rows,
    });
    expect(second).toEqual({ inserted: 0, skipped: 1, invalid: 0 });
    const leads = await t.run(async (ctx) => ctx.db.query("leads").collect());
    expect(leads).toHaveLength(1);
  });
});
