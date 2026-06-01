import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

describe("submitLead", () => {
  it("inserts a valid lead", async () => {
    const t = convexTest(schema);

    const result = await t.mutation(api.leads.submitLead, {
      name: "Jane Doe",
      email: "jane@example.com",
      budget: "€5k-€10k",
      description: "Need a CV pipeline for retail analytics.",
    });

    expect(result).toEqual({ success: true });

    const leads = await t.run(async (ctx) => ctx.db.query("leads").collect());
    expect(leads).toHaveLength(1);
    expect(leads[0]).toMatchObject({
      name: "Jane Doe",
      email: "jane@example.com",
      budget: "€5k-€10k",
    });
    expect(leads[0].createdAt).toBeTypeOf("number");
  });

  it("allows optional budget", async () => {
    const t = convexTest(schema);

    await t.mutation(api.leads.submitLead, {
      name: "Jane Doe",
      email: "jane@example.com",
      description: "Project without budget.",
    });

    const leads = await t.run(async (ctx) => ctx.db.query("leads").collect());
    expect(leads[0].budget).toBeUndefined();
  });

  it("rejects missing name", async () => {
    const t = convexTest(schema);
    await expect(
      t.mutation(api.leads.submitLead, {
        name: "   ",
        email: "jane@example.com",
        description: "Valid description.",
      }),
    ).rejects.toThrow(/Name is required/);
  });

  it("rejects invalid email", async () => {
    const t = convexTest(schema);
    await expect(
      t.mutation(api.leads.submitLead, {
        name: "Jane",
        email: "not-an-email",
        description: "Valid description.",
      }),
    ).rejects.toThrow(/Invalid email/);
  });

  it("rejects invalid budget", async () => {
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

  it("rejects oversized description", async () => {
    const t = convexTest(schema);
    await expect(
      t.mutation(api.leads.submitLead, {
        name: "Jane",
        email: "jane@example.com",
        description: "x".repeat(5001),
      }),
    ).rejects.toThrow(/too long/);
  });
});
