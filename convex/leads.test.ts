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

  it("stores only canonical bounded estimate context and uses labels in notification text", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(api.leads.submitLead, {
      name: "Context Lead",
      email: "context@example.com",
      description: "A normal request.",
      inquiryContext: {
        origin: "case-study",
        caseStudySlug: "invoice-ocr-extraction",
        projectType: "document-web-extraction",
        serviceId: "document-web-extraction",
        timeline: "within-one-month",
      },
    });
    const [lead] = await t.run(async (ctx) => ctx.db.query("leads").collect());
    expect(lead.inquiryContext).toEqual({
      origin: "case-study",
      caseStudySlug: "invoice-ocr-extraction",
      projectType: "document-web-extraction",
      serviceId: "document-web-extraction",
      timeline: "within-one-month",
    });
    const payload = buildContactEmailPayload({
      leadId: lead._id,
      name: lead.name,
      email: lead.email,
      description: lead.description,
      inquiryContext: lead.inquiryContext,
    }, { from: "Portfolio Contact <hello@example.com>", recipient: "owner@example.com" });
    expect(payload.text).toContain("Case study viewed: Invoice OCR Client-Field Extraction");
    expect(payload.text).toContain("Timing: Within one month");
    expect(payload.text).not.toContain("rawDiagnosticAnswer");
  });

  it("rejects forged estimate context before insert or scheduling", async () => {
    const t = convexTest(schema, modules);
    await expect(t.mutation(api.leads.submitLead, {
      name: "Forged Context",
      email: "forged@example.com",
      description: "Must not persist.",
      inquiryContext: {
        origin: "case-study",
        caseStudySlug: "invoice-ocr-extraction",
        projectType: "computer-vision",
        serviceId: "computer-vision",
      },
    })).rejects.toThrow(/Invalid estimate context/);
    expect(await t.run(async (ctx) => ctx.db.query("leads").collect())).toEqual([]);
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

  it("returns persisted context for retry while legacy rows remain valid", async () => {
    const t = convexTest(schema, modules);
    const contextualLeadId = await t.run(async (ctx) => ctx.db.insert("leads", {
      name: "Context Retry",
      email: "context-retry@example.com",
      description: "Retry reads the stored values.",
      createdAt: Date.now(),
      inquiryContext: { origin: "fit-diagnostic", fitDecision: "not-recommended" },
      emailNotificationStatus: "pending",
      emailNotificationUpdatedAt: Date.now(),
    }));
    const legacyLeadId = await t.run(async (ctx) => ctx.db.insert("leads", {
      name: "Legacy Retry",
      email: "legacy-retry@example.com",
      description: "No new optional fields.",
      createdAt: Date.now(),
      emailNotificationStatus: "pending",
      emailNotificationUpdatedAt: Date.now(),
    }));
    const contextualClaim = await t.mutation(internal.leads.claimEmailNotificationAttempt, { leadId: contextualLeadId });
    const legacyClaim = await t.mutation(internal.leads.claimEmailNotificationAttempt, { leadId: legacyLeadId });
    expect(contextualClaim?.inquiryContext).toEqual({ origin: "fit-diagnostic", fitDecision: "not-recommended" });
    expect(legacyClaim?.inquiryContext).toBeUndefined();
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

  it("stops claiming a lead after three cron retries and uses resend_error", async () => {
    const now = new Date("2026-06-15T12:00:00.000Z");
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const t = convexTest(schema, modules);
    const staleUpdatedAt = now.getTime() - 6 * 60 * 1000;
    const leadId = await t.run(async (ctx) =>
      ctx.db.insert("leads", {
        name: "Retry Cap",
        email: "retry-cap@example.com",
        description: "Transient failures should not retry forever.",
        createdAt: staleUpdatedAt,
        emailNotificationStatus: "pending",
        emailNotificationUpdatedAt: staleUpdatedAt,
      }),
    );

    const cutoff = now.getTime() - 5 * 60 * 1000;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const claimed = await t.mutation(internal.leads.claimStaleEmailNotificationRetries, {
        cutoff,
      });
      expect(claimed).toHaveLength(1);
      expect(claimed[0]._id).toBe(leadId);
      const afterClaim = await t.run(async (ctx) => ctx.db.get(leadId));
      expect(afterClaim?.emailNotificationAttemptCount).toBe(attempt);
      expect(afterClaim?.emailNotificationStatus).toBe("retrying");
      await t.run(async (ctx) => {
        await ctx.db.patch(leadId, {
          emailNotificationStatus: "pending",
          emailNotificationUpdatedAt: staleUpdatedAt,
        });
      });
    }

    const exhausted = await t.mutation(internal.leads.claimStaleEmailNotificationRetries, {
      cutoff,
    });
    expect(exhausted).toHaveLength(0);
    const lead = await t.run(async (ctx) => ctx.db.get(leadId));
    expect(lead?.emailNotificationStatus).toBe("resend_error");
    expect(lead?.emailNotificationError).toBe("Gave up after 3 email retries.");
    expect(lead?.emailNotificationError).not.toContain("Email notification retry claimed.");

    const secondPass = await t.mutation(internal.leads.claimStaleEmailNotificationRetries, {
      cutoff,
    });
    expect(secondPass).toHaveLength(0);
  });

  it("exhausts a hung sending reclaim against the same retry cap", async () => {
    const now = new Date("2026-06-15T12:00:00.000Z");
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const t = convexTest(schema, modules);
    const staleUpdatedAt = now.getTime() - 6 * 60 * 1000;
    const leadId = await t.run(async (ctx) =>
      ctx.db.insert("leads", {
        name: "Hung Send",
        email: "hung-send@example.com",
        description: "Stuck in sending.",
        createdAt: staleUpdatedAt,
        emailNotificationStatus: "sending",
        emailNotificationUpdatedAt: staleUpdatedAt,
        emailNotificationAttemptCount: 3,
      }),
    );

    const claimed = await t.mutation(internal.leads.claimStaleEmailNotificationRetries, {
      cutoff: now.getTime() - 5 * 60 * 1000,
    });
    expect(claimed).toHaveLength(0);
    const lead = await t.run(async (ctx) => ctx.db.get(leadId));
    expect(lead?.emailNotificationStatus).toBe("resend_error");
    expect(lead?.emailNotificationError).toBe("Gave up after 3 email retries.");
  });

  it("reclaims a hung sending lead under the cap and increments the count", async () => {
    const now = new Date("2026-06-15T12:00:00.000Z");
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const t = convexTest(schema, modules);
    const staleUpdatedAt = now.getTime() - 6 * 60 * 1000;
    const leadId = await t.run(async (ctx) =>
      ctx.db.insert("leads", {
        name: "Hung Under Cap",
        email: "hung-under@example.com",
        description: "Stuck in sending under cap.",
        createdAt: staleUpdatedAt,
        emailNotificationStatus: "sending",
        emailNotificationUpdatedAt: staleUpdatedAt,
        emailNotificationAttemptCount: 2,
      }),
    );

    const claimed = await t.mutation(internal.leads.claimStaleEmailNotificationRetries, {
      cutoff: now.getTime() - 5 * 60 * 1000,
    });
    expect(claimed).toHaveLength(1);
    const underCap = await t.run(async (ctx) => ctx.db.get(leadId));
    expect(underCap?.emailNotificationStatus).toBe("retrying");
    expect(underCap?.emailNotificationAttemptCount).toBe(3);
  });

  it("keeps the retry count when a transient bounce returns the row to pending", async () => {
    const now = new Date("2026-06-15T12:00:00.000Z");
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const t = convexTest(schema, modules);
    const staleUpdatedAt = now.getTime() - 6 * 60 * 1000;
    const leadId = await t.run(async (ctx) =>
      ctx.db.insert("leads", {
        name: "Bounce Count",
        email: "bounce-count@example.com",
        description: "Count must survive pending bounce.",
        createdAt: staleUpdatedAt,
        emailNotificationStatus: "pending",
        emailNotificationUpdatedAt: staleUpdatedAt,
        emailNotificationAttemptCount: 2,
      }),
    );

    await t.mutation(internal.leads.claimStaleEmailNotificationRetries, {
      cutoff: now.getTime() - 5 * 60 * 1000,
    });
    await t.mutation(internal.leads.markEmailNotificationStatus, {
      leadId,
      status: "pending",
      error: "Transient Resend API error 429: rate limited",
    });

    const bounced = await t.run(async (ctx) => ctx.db.get(leadId));
    expect(bounced?.emailNotificationStatus).toBe("pending");
    expect(bounced?.emailNotificationAttemptCount).toBe(3);
  });

  it("does not increment the retry count on an individual send claim", async () => {
    const now = new Date("2026-06-15T12:00:00.000Z");
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const t = convexTest(schema, modules);
    const leadId = await t.run(async (ctx) =>
      ctx.db.insert("leads", {
        name: "Send Claim",
        email: "send-claim@example.com",
        description: "Individual claim is not a cron retry.",
        createdAt: now.getTime(),
        emailNotificationStatus: "retrying",
        emailNotificationUpdatedAt: now.getTime(),
        emailNotificationAttemptCount: 2,
      }),
    );

    const claimed = await t.mutation(internal.leads.claimEmailNotificationAttempt, {
      leadId,
    });
    expect(claimed?._id).toBe(leadId);
    const afterSendClaim = await t.run(async (ctx) => ctx.db.get(leadId));
    expect(afterSendClaim?.emailNotificationStatus).toBe("sending");
    expect(afterSendClaim?.emailNotificationAttemptCount).toBe(2);
  });

  it("does not claim terminal email statuses even with a zero retry count", async () => {
    const now = new Date("2026-06-15T12:00:00.000Z");
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const t = convexTest(schema, modules);
    const staleUpdatedAt = now.getTime() - 6 * 60 * 1000;
    await t.run(async (ctx) => {
      for (const status of ["sent", "missing_api_key", "resend_error", "unexpected_error"] as const) {
        await ctx.db.insert("leads", {
          name: status,
          email: `${status}@example.com`,
          description: "Terminal status must stay unclaimed.",
          createdAt: staleUpdatedAt,
          emailNotificationStatus: status,
          emailNotificationUpdatedAt: staleUpdatedAt,
          emailNotificationAttemptCount: 0,
        });
      }
    });

    const claimed = await t.mutation(internal.leads.claimStaleEmailNotificationRetries, {
      cutoff: now.getTime() - 5 * 60 * 1000,
    });
    expect(claimed).toHaveLength(0);
  });

  it("retries uncapped leads in a mixed batch and exhausts the capped one", async () => {
    const now = new Date("2026-06-15T12:00:00.000Z");
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const t = convexTest(schema, modules);
    const staleUpdatedAt = now.getTime() - 6 * 60 * 1000;
    const [freshId, exhaustedId] = await t.run(async (ctx) => {
      const fresh = await ctx.db.insert("leads", {
        name: "Still Retrying",
        email: "fresh-retry@example.com",
        description: "Under the cap.",
        createdAt: staleUpdatedAt,
        emailNotificationStatus: "pending",
        emailNotificationUpdatedAt: staleUpdatedAt,
      });
      const exhausted = await ctx.db.insert("leads", {
        name: "Already Capped",
        email: "capped@example.com",
        description: "At the cap.",
        createdAt: staleUpdatedAt,
        emailNotificationStatus: "pending",
        emailNotificationUpdatedAt: staleUpdatedAt,
        emailNotificationAttemptCount: 3,
      });
      return [fresh, exhausted];
    });

    const claimed = await t.mutation(internal.leads.claimStaleEmailNotificationRetries, {
      cutoff: now.getTime() - 5 * 60 * 1000,
    });
    expect(claimed).toHaveLength(1);
    expect(claimed[0]._id).toBe(freshId);
    const exhausted = await t.run(async (ctx) => ctx.db.get(exhaustedId));
    expect(exhausted?.emailNotificationStatus).toBe("resend_error");
  });
});
