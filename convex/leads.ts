import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction, mutation } from "./_generated/server";

const BUDGET_OPTIONS = ["< €5k", "€5k-€10k", "€10k-€25k", "€25k+"] as const;
const MAX_NAME_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 5000;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeBudget(budget: string | undefined) {
  const trimmed = budget?.trim();
  if (!trimmed) {
    return undefined;
  }
  if (!BUDGET_OPTIONS.includes(trimmed as (typeof BUDGET_OPTIONS)[number])) {
    throw new ConvexError("Invalid budget range.");
  }
  return trimmed;
}

function validateLeadInput(args: {
  name: string;
  email: string;
  budget?: string;
  description: string;
}) {
  const name = args.name.trim();
  const email = args.email.trim();
  const description = args.description.trim();
  const budget = normalizeBudget(args.budget);

  if (!name) {
    throw new ConvexError("Name is required.");
  }
  if (name.length > MAX_NAME_LENGTH) {
    throw new ConvexError("Name is too long.");
  }
  if (!email) {
    throw new ConvexError("Email is required.");
  }
  if (!EMAIL_REGEX.test(email)) {
    throw new ConvexError("Invalid email address.");
  }
  if (!description) {
    throw new ConvexError("Project description is required.");
  }
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    throw new ConvexError("Project description is too long.");
  }

  return { name, email, description, budget };
}

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
