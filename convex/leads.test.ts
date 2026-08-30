/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { afterEach, describe, expect, it, vi } from "vitest";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import {
  buildContactEmailPayload,
  sendContactEmailNotification,
} from "./leads";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

describe("submitLead", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("CVX-001: inserts a valid lead with budget", async () => {
    const t = convexTest(schema, modules);
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
      emailNotificationStatus: "pending",
    });
    expect(leads[0].emailNotificationUpdatedAt).toEqual(expect.any(Number));
  });

  it("CVX-002: allows optional budget", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(api.leads.submitLead, {
      name: "Jane Doe",
      email: "jane@example.com",
      description: "Project without budget.",
    });
    const leads = await t.run(async (ctx) => ctx.db.query("leads").collect());
    expect(leads[0].budget).toBeUndefined();
  });

  it("CVX-003: rejects empty name", async () => {
    const t = convexTest(schema, modules);
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
    const t = convexTest(schema, modules);
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
    const t = convexTest(schema, modules);
    await expect(
      t.mutation(api.leads.submitLead, {
        name: "Jane",
        email: "   ",
        description: "Valid description.",
      }),
    ).rejects.toThrow(/Email is required/);
  });

  it("CVX-005: rejects missing description", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.mutation(api.leads.submitLead, {
        name: "Jane",
        email: "jane@example.com",
        description: "   ",
      }),
    ).rejects.toThrow(/description is required/i);
  });

  it("CVX-006: rejects invalid email formats", async () => {
    const t = convexTest(schema, modules);
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
    const t = convexTest(schema, modules);
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
    const t = convexTest(schema, modules);
    await expect(
      t.mutation(api.leads.submitLead, {
        name: "x".repeat(201),
        email: "jane@example.com",
        description: "Valid description.",
      }),
    ).rejects.toThrow(/Name is too long/);
  });

  it("CVX-010: rejects oversized description", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.mutation(api.leads.submitLead, {
        name: "Jane",
        email: "jane@example.com",
        description: "x".repeat(5001),
      }),
    ).rejects.toThrow(/too long/);
  });

  it("CVX-011: stores XSS-like payload as plain text", async () => {
    const t = convexTest(schema, modules);
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
    const t = convexTest(schema, modules);
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
    const t = convexTest(schema, modules);
    const input = {
      name: "Jane",
      email: "rate-limit@example.com",
      description: "Rate limit check.",
    };
    for (let i = 0; i < 3; i++) {
      await t.mutation(api.leads.submitLead, input);
    }
    await expect(t.mutation(api.leads.submitLead, input)).rejects.toThrow(
      /This email already sent several messages recently/,
    );
    const leads = await t.run(async (ctx) => ctx.db.query("leads").collect());
    expect(leads).toHaveLength(3);
  });

  it("rejects submissions when the global contact throttle is full", async () => {
    const now = new Date("2026-06-15T12:00:00.000Z");
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const t = convexTest(schema, modules);
    for (let i = 0; i < 30; i++) {
      await t.run(async (ctx) => {
        await ctx.db.insert("leads", {
          name: `Lead ${i}`,
          email: `global-${i}@example.com`,
          description: "Recent global contact.",
          createdAt: now.getTime() - 1,
        });
      });
    }

    await expect(
      t.mutation(api.leads.submitLead, {
        name: "Jane",
        email: "global-limit@example.com",
        description: "Global throttle should reject.",
      }),
    ).rejects.toThrow(/The site is receiving too many requests/);
  });

  it("allows a submit when one prior lead is exactly on the rate-limit boundary", async () => {
    const now = new Date("2026-06-15T12:00:00.000Z");
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const t = convexTest(schema, modules);
    const email = "boundary@example.com";
    const cutoff = now.getTime() - 3_600_000;

    await t.run(async (ctx) => {
      await ctx.db.insert("leads", {
        name: "Boundary",
        email,
        description: "Exactly one hour ago.",
        createdAt: cutoff,
      });
      await ctx.db.insert("leads", {
        name: "Recent One",
        email,
        description: "Inside the window.",
        createdAt: cutoff + 1,
      });
      await ctx.db.insert("leads", {
        name: "Recent Two",
        email,
        description: "Also inside the window.",
        createdAt: now.getTime() - 1,
      });
    });

    await expect(
      t.mutation(api.leads.submitLead, {
        name: "Jane",
        email,
        description: "Boundary submit should pass.",
      }),
    ).resolves.toEqual({ success: true });

    const leads = await t.run(async (ctx) =>
      ctx.db
        .query("leads")
        .withIndex("by_email_and_createdAt", (q) => q.eq("email", email))
        .collect(),
    );
    expect(leads).toHaveLength(4);
  });

  it("CVX-013: allows parallel duplicate submits", async () => {
    const t = convexTest(schema, modules);
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

describe("contact email notification", () => {
  const leadId = "lead_123" as Id<"leads">;
  const lead = {
    leadId,
    name: "Jane Doe",
    email: "jane@example.com",
    budget: "€5k-€10k",
    description: "Need a CV pipeline for retail analytics.",
  };

  it("builds the Resend payload with sender, recipient, reply-to, subject, and body", () => {
    const payload = buildContactEmailPayload(lead, {
      from: "Portfolio Contact <hello@vivekapatel.com>",
      recipient: "vivek@example.com",
    });

    expect(payload).toMatchObject({
      from: "Portfolio Contact <hello@vivekapatel.com>",
      to: ["vivek@example.com"],
      reply_to: "jane@example.com",
      subject: "New lead from Jane Doe",
    });
    expect(payload.text).toContain("Name: Jane Doe");
    expect(payload.text).toContain("Email: jane@example.com");
    expect(payload.text).toContain("Budget: €5k-€10k");
    expect(payload.text).toContain("Need a CV pipeline for retail analytics.");
    expect(payload.text).toContain(`Lead ID: ${leadId}`);
  });

  it("logs and skips Resend when RESEND_API_KEY is missing", async () => {
    const fetchSpy = vi.fn();
    const logger = { error: vi.fn() };

    const result = await sendContactEmailNotification(lead, {
      env: {},
      fetch: fetchSpy as unknown as typeof fetch,
      logger,
    });

    expect(result).toEqual({ status: "missing-api-key" });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      "sendContactEmail: RESEND_API_KEY is not set. Lead saved:",
      leadId,
    );
  });

  it("logs non-OK Resend responses", async () => {
    const fetchSpy = vi.fn(
      async () => new Response("bad sender", { status: 422 }),
    );
    const logger = { error: vi.fn() };

    const result = await sendContactEmailNotification(lead, {
      env: {
        RESEND_API_KEY: "test-key",
        CONTACT_RECIPIENT_EMAIL: "vivek@example.com",
        RESEND_FROM_EMAIL: "Portfolio Contact <hello@vivekapatel.com>",
      },
      fetch: fetchSpy as unknown as typeof fetch,
      logger,
    });

    expect(result).toEqual({
      status: "resend-error",
      httpStatus: 422,
      body: "bad sender",
    });
    expect(logger.error).toHaveBeenCalledWith(
      "sendContactEmail: Resend API error",
      422,
      "bad sender",
      "leadId:",
      leadId,
    );
  });

  it("builds a missing API key result that can be stored on the lead", async () => {
    const result = await sendContactEmailNotification(lead, {
      env: {},
      fetch: vi.fn() as unknown as typeof fetch,
      logger: { error: vi.fn() },
    });

    expect(result).toEqual({ status: "missing-api-key" });
  });
});

describe("email notification retry state", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("claims stale pending leads transactionally before retry scheduling", async () => {
    const now = new Date("2026-06-15T12:00:00.000Z");
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const t = convexTest(schema, modules);
    const staleUpdatedAt = now.getTime() - 6 * 60 * 1000;
    const leadId = await t.run(async (ctx) =>
      ctx.db.insert("leads", {
        name: "Retry Me",
        email: "retry@example.com",
        description: "Pending too long.",
        createdAt: staleUpdatedAt,
        emailNotificationStatus: "pending",
        emailNotificationUpdatedAt: staleUpdatedAt,
      }),
    );

    const first = await t.mutation(
      internal.leads.claimStaleEmailNotificationRetries,
      { cutoff: now.getTime() - 5 * 60 * 1000 },
    );
    const second = await t.mutation(
      internal.leads.claimStaleEmailNotificationRetries,
      { cutoff: now.getTime() - 5 * 60 * 1000 },
    );

    expect(first).toHaveLength(1);
    expect(first[0]._id).toBe(leadId);
    expect(second).toHaveLength(0);

    const lead = await t.run(async (ctx) => ctx.db.get(leadId));
    expect(lead?.emailNotificationStatus).toBe("retrying");
    expect(lead?.emailNotificationUpdatedAt).toBe(now.getTime());
  });

  it("claiming an individual attempt prevents duplicate sends", async () => {
    const now = new Date("2026-06-15T12:00:00.000Z");
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const t = convexTest(schema, modules);
    const leadId = await t.run(async (ctx) =>
      ctx.db.insert("leads", {
        name: "Send Once",
        email: "once@example.com",
        description: "Only one sender should claim this.",
        createdAt: now.getTime(),
        emailNotificationStatus: "pending",
        emailNotificationUpdatedAt: now.getTime(),
      }),
    );

    const first = await t.mutation(internal.leads.claimEmailNotificationAttempt, {
      leadId,
    });
    const second = await t.mutation(internal.leads.claimEmailNotificationAttempt, {
      leadId,
    });

    expect(first?._id).toBe(leadId);
    expect(second).toBeNull();
    const lead = await t.run(async (ctx) => ctx.db.get(leadId));
    expect(lead?.emailNotificationStatus).toBe("sending");
  });

  it("reclaims stale retrying leads that were claimed but not scheduled", async () => {
    const now = new Date("2026-06-15T12:00:00.000Z");
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const t = convexTest(schema, modules);
    const staleUpdatedAt = now.getTime() - 6 * 60 * 1000;
    const leadId = await t.run(async (ctx) =>
      ctx.db.insert("leads", {
        name: "Retry Again",
        email: "retry-again@example.com",
        description: "Retrying state got stuck.",
        createdAt: staleUpdatedAt,
        emailNotificationStatus: "retrying",
        emailNotificationUpdatedAt: staleUpdatedAt,
      }),
    );

    const claimed = await t.mutation(
      internal.leads.claimStaleEmailNotificationRetries,
      { cutoff: now.getTime() - 5 * 60 * 1000 },
    );

    expect(claimed).toHaveLength(1);
    expect(claimed[0]._id).toBe(leadId);
  });

  it("reclaims stale sending leads that timed out", async () => {
    const now = new Date("2026-06-15T12:00:00.000Z");
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const t = convexTest(schema, modules);
    const staleUpdatedAt = now.getTime() - 6 * 60 * 1000;
    const leadId = await t.run(async (ctx) =>
      ctx.db.insert("leads", {
        name: "Send Timeout",
        email: "timeout@example.com",
        description: "Sending state timed out.",
        createdAt: staleUpdatedAt,
        emailNotificationStatus: "sending",
        emailNotificationUpdatedAt: staleUpdatedAt,
      }),
    );

    const claimed = await t.mutation(
      internal.leads.claimStaleEmailNotificationRetries,
      { cutoff: now.getTime() - 5 * 60 * 1000 },
    );

    expect(claimed).toHaveLength(1);
    expect(claimed[0]._id).toBe(leadId);
    expect(claimed[0].name).toBe("Send Timeout");
  });

  it("keeps transient Resend responses retryable as pending", async () => {
    const now = new Date("2026-06-15T12:00:00.000Z");
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const t = convexTest(schema, modules);
    const leadId = await t.run(async (ctx) =>
      ctx.db.insert("leads", {
        name: "Transient",
        email: "transient@example.com",
        description: "Retry later.",
        createdAt: now.getTime(),
        emailNotificationStatus: "sending",
        emailNotificationUpdatedAt: now.getTime(),
      }),
    );

    await t.mutation(internal.leads.markEmailNotificationStatus, {
      leadId,
      status: "pending",
      error: "Transient Resend API error 500: temporarily unavailable",
    });

    const lead = await t.run(async (ctx) => ctx.db.get(leadId));
    expect(lead?.emailNotificationStatus).toBe("pending");
    expect(lead?.emailNotificationError).toContain("Transient Resend API error");
    expect(lead?.emailNotificationUpdatedAt).toBe(now.getTime());
  });
});
