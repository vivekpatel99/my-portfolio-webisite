import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

describe("submitLead", () => {
  it("CVX-001: inserts a valid lead with budget", async () => {
    const t = convexTest(schema);
    const result = await t.mutation(api.leads.submitLead, {
      name: "Jane Doe",
      email: "jane@example.com",
      budget: "€5k-€10k",
      description: "Need a CV pipeline for retail analytics.",
    });
    expect(result).toEqual({ success: true });
    const leads = await t.run(async (ctx) => ctx.db.query("leads").collect());
    expect(leads[0]).toMatchObject({
      name: "Jane Doe",
      email: "jane@example.com",
      budget: "€5k-€10k",
    });
  });

  it("CVX-002: allows optional budget", async () => {
    const t = convexTest(schema);
    await t.mutation(api.leads.submitLead, {
      name: "Jane Doe",
      email: "jane@example.com",
      description: "Project without budget.",
    });
    const leads = await t.run(async (ctx) => ctx.db.query("leads").collect());
    expect(leads[0].budget).toBeUndefined();
  });

  it("CVX-003: rejects empty name", async () => {
    const t = convexTest(schema);
    await expect(
      t.mutation(api.leads.submitLead, {
        name: "",
        email: "jane@example.com",
        description: "Valid description.",
      }),
    ).rejects.toThrow(/Name is required/);
    const leads = await t.run(async (ctx) => ctx.db.query("leads").collect());
    expect(leads).toHaveLength(0);
  });

  it("CVX-008: rejects whitespace-only name", async () => {
    const t = convexTest(schema);
    await expect(
      t.mutation(api.leads.submitLead, {
        name: " \t\n ",
        email: "jane@example.com",
        description: "Valid description.",
      }),
    ).rejects.toThrow(/Name is required/);
    const leads = await t.run(async (ctx) => ctx.db.query("leads").collect());
    expect(leads).toHaveLength(0);
  });

  it("CVX-004: rejects missing email", async () => {
    const t = convexTest(schema);
    await expect(
      t.mutation(api.leads.submitLead, {
        name: "Jane",
        email: "   ",
        description: "Valid description.",
      }),
    ).rejects.toThrow(/Email is required/);
  });

  it("CVX-005: rejects missing description", async () => {
    const t = convexTest(schema);
    await expect(
      t.mutation(api.leads.submitLead, {
        name: "Jane",
        email: "jane@example.com",
        description: "   ",
      }),
    ).rejects.toThrow(/description is required/i);
  });

  it("CVX-006: rejects invalid email formats", async () => {
    const t = convexTest(schema);
    for (const email of ["not-an-email", "a@", "@b.com"]) {
      await expect(
        t.mutation(api.leads.submitLead, {
          name: "Jane",
          email,
          description: "Valid description.",
        }),
      ).rejects.toThrow(/Invalid email/);
    }
  });

  it("CVX-007: rejects invalid budget enum", async () => {
    const t = convexTest(schema);
    await expect(
      t.mutation(api.leads.submitLead, {
        name: "Jane",
        email: "jane@example.com",
        budget: "€999k",
        description: "Valid description.",
      }),
    ).rejects.toThrow(/Invalid budget/);
  });

  it("CVX-009: rejects oversized name", async () => {
    const t = convexTest(schema);
    await expect(
      t.mutation(api.leads.submitLead, {
        name: "x".repeat(201),
        email: "jane@example.com",
        description: "Valid description.",
      }),
    ).rejects.toThrow(/Name is too long/);
  });

  it("CVX-010: rejects oversized description", async () => {
    const t = convexTest(schema);
    await expect(
      t.mutation(api.leads.submitLead, {
        name: "Jane",
        email: "jane@example.com",
        description: "x".repeat(5001),
      }),
    ).rejects.toThrow(/too long/);
  });

  it("CVX-011: stores XSS-like payload as plain text", async () => {
    const t = convexTest(schema);
    const payload = "<script>alert(1)</script>";
    await t.mutation(api.leads.submitLead, {
      name: payload,
      email: "jane@example.com",
      description: "Valid description.",
    });
    const leads = await t.run(async (ctx) => ctx.db.query("leads").collect());
    expect(leads[0].name).toBe(payload);
  });

  it("CVX-012: accepts unicode and emoji", async () => {
    const t = convexTest(schema);
    await t.mutation(api.leads.submitLead, {
      name: "Jane 🚀",
      email: "jane@example.com",
      description: "项目说明",
    });
    const leads = await t.run(async (ctx) => ctx.db.query("leads").collect());
    expect(leads[0].name).toBe("Jane 🚀");
    expect(leads[0].description).toBe("项目说明");
  });

  it("rejects 4th submit from same email within one hour", async () => {
    const t = convexTest(schema);
    const input = {
      name: "Jane",
      email: "rate-limit@example.com",
      description: "Rate limit check.",
    };
    for (let i = 0; i < 3; i++) {
      await t.mutation(api.leads.submitLead, input);
    }
    await expect(t.mutation(api.leads.submitLead, input)).rejects.toThrow(
      /Please wait before submitting again/,
    );
    const leads = await t.run(async (ctx) => ctx.db.query("leads").collect());
    expect(leads).toHaveLength(3);
  });

  it("CVX-013: allows parallel duplicate submits", async () => {
    const t = convexTest(schema);
    const input = {
      name: "Jane",
      email: "jane@example.com",
      description: "Same inquiry twice.",
    };
    await Promise.all([
      t.mutation(api.leads.submitLead, input),
      t.mutation(api.leads.submitLead, input),
    ]);
    const leads = await t.run(async (ctx) => ctx.db.query("leads").collect());
    expect(leads).toHaveLength(2);
  });
});