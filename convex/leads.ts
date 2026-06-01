import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction, mutation } from "./_generated/server";
import { validateLeadInput } from "./lib/leadValidation";

const RATE_LIMIT_WINDOW_MS = 3_600_000;
const RATE_LIMIT_MAX_SUBMISSIONS = 3;

export const submitLead = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    budget: v.optional(v.string()),
    description: v.string(),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const lead = validateLeadInput(args);

    const cutoff = Date.now() - RATE_LIMIT_WINDOW_MS;
    const recent = await ctx.db
      .query("leads")
      .withIndex("by_email", (q) => q.eq("email", lead.email))
      .filter((q) => q.gt(q.field("createdAt"), cutoff))
      .collect();

    if (recent.length >= RATE_LIMIT_MAX_SUBMISSIONS) {
      throw new ConvexError("Please wait before submitting again.");
    }

    const leadId = await ctx.db.insert("leads", {
      ...lead,
      createdAt: Date.now(),
    });

    await ctx.scheduler.runAfter(0, internal.leads.sendContactEmail, {
      leadId,
      name: lead.name,
      email: lead.email,
      budget: lead.budget,
      description: lead.description,
    });

    return { success: true };
  },
});

export const sendContactEmail = internalAction({
  args: {
    leadId: v.id("leads"),
    name: v.string(),
    email: v.string(),
    budget: v.optional(v.string()),
    description: v.string(),
  },
  returns: v.null(),
  handler: async (_ctx, args) => {
    const apiKey = process.env.RESEND_API_KEY;
    const recipient =
      process.env.CONTACT_RECIPIENT_EMAIL ?? "vivekp.freelance@pm.me";
    const from =
      process.env.RESEND_FROM_EMAIL ?? "Portfolio Contact <onboarding@resend.dev>";

    if (!apiKey) {
      console.error(
        "sendContactEmail: RESEND_API_KEY is not set. Lead saved:",
        args.leadId,
      );
      return null;
    }

    const budgetLine = args.budget
      ? `Budget: ${args.budget}`
      : "Budget: (not specified)";

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [recipient],
        reply_to: args.email,
        subject: `New lead from ${args.name}`,
        text: [
          `New contact form submission`,
          ``,
          `Name: ${args.name}`,
          `Email: ${args.email}`,
          budgetLine,
          ``,
          `Description:`,
          args.description,
          ``,
          `Lead ID: ${args.leadId}`,
        ].join("\n"),
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(
        "sendContactEmail: Resend API error",
        response.status,
        body,
        "leadId:",
        args.leadId,
      );
    }

    return null;
  },
});
