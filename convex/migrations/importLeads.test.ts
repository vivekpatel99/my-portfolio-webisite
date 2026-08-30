import { convexTest } from "convex-test";
import { afterEach, describe, expect, it, vi } from "vitest";
import { internal } from "../_generated/api";
import schema from "../schema";

describe("importFromRows", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

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

  it("MIG-005: duplicate rows both insert when there is no import key", async () => {
    const t = convexTest(schema);
    const row = {
      name: "Legacy Lead",
      email: "legacy-dup@example.com",
      description: "No import key — no dedup.",
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

  it("rejects import batches over the transaction limit", async () => {
    const t = convexTest(schema);
    const rows = Array.from({ length: 101 }, (_, index) => ({
      name: `Legacy Lead ${index}`,
      email: `legacy-${index}@example.com`,
      description: "Batch too large.",
    }));

    await expect(
      t.mutation(internal.migrations.importLeads.importFromRows, { rows }),
    ).rejects.toThrow(/limited to 100 rows/);
  });

  it("counts invalid createdAt values without inserting those rows", async () => {
    const now = new Date("2026-06-15T12:00:00.000Z");
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const t = convexTest(schema);
    const result = await t.mutation(internal.migrations.importLeads.importFromRows, {
      rows: [
        {
          name: "Negative Timestamp",
          email: "negative@example.com",
          description: "Should not insert.",
          createdAt: -1,
        },
        {
          name: "Future Timestamp",
          email: "future@example.com",
          description: "Should not insert.",
          createdAt: now.getTime() + 24 * 60 * 60 * 1000 + 1,
        },
        {
          name: "Valid Timestamp",
          email: "valid@example.com",
          description: "Should insert.",
          createdAt: now.getTime(),
        },
      ],
    });

    expect(result).toEqual({ inserted: 1, skipped: 0, invalid: 2 });
    const leads = await t.run(async (ctx) => ctx.db.query("leads").collect());
    expect(leads).toHaveLength(1);
    expect(leads[0].email).toBe("valid@example.com");
  });
});
