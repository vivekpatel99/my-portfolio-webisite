import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { internal } from "../_generated/api";
import schema from "../schema";

describe("importFromRows", () => {
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
    expect(first).toEqual({ inserted: 1, skipped: 0 });
    const second = await t.mutation(internal.migrations.importLeads.importFromRows, {
      rows,
    });
    expect(second).toEqual({ inserted: 0, skipped: 1 });
    const leads = await t.run(async (ctx) => ctx.db.query("leads").collect());
    expect(leads).toHaveLength(1);
  });
});
