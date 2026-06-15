import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { internalAction, internalMutation, internalQuery, mutation } from "./_generated/server";
import { validateLeadInput } from "./lib/leadValidation";

const RATE_LIMIT_WINDOW_MS = 3_600_000;
const RATE_LIMIT_MAX_SUBMISSIONS = 3;
const RESEND_SANDBOX_FROM = "onboarding@resend.dev";
const DEFAULT_FROM = `Portfolio Contact <${RESEND_SANDBOX_FROM}>`;

type ContactEmailArgs = {
  leadId: Id<"leads">;
  name: string;
  email: string;
  budget?: string;
  description: string;
};

type ContactEmailPayload = {
  from: string;
  to: string[];
  reply_to: string;
  subject: string;
  text: string;
};

type ContactEmailSendResult =
  | { status: "sent" }
  | { status: "missing-api-key" }
  | { status: "resend-error"; httpStatus: number; body: string };

type EmailNotificationStatus =
  | "pending"
  | "sent"
  | "missing_api_key"
  | "resend_error"
  | "unexpected_error";

type EmailNotificationUpdateStatus = Exclude<
  EmailNotificationStatus,
  "pending"
>;

type ContactEmailDependencies = {
  env?: Record<string, string | undefined>;
  fetch?: typeof fetch;
  logger?: Pick<Console, "error">;
};

function isConvexProduction(env: Record<string, string | undefined>): boolean {
  const cloudUrl = env.CONVEX_CLOUD_URL ?? "";
  if (cloudUrl.includes("convex.cloud")) {
    return true;
  }
  const deployment = env.CONVEX_DEPLOYMENT ?? "";
  return deployment.length > 0 && !deployment.includes("anonymous");
}

function usesResendSandboxFrom(resendFromEmail: string | undefined): boolean {
  if (!resendFromEmail) {
    return true;
  }
  return resendFromEmail.includes(RESEND_SANDBOX_FROM);
}

export function buildContactEmailPayload(
  args: ContactEmailArgs,
  options: { recipient: string; from: string },
): ContactEmailPayload {
  const budgetLine = args.budget
    ? `Budget: ${args.budget}`
    : "Budget: (not specified)";

  return {
    from: options.from,
    to: [options.recipient],
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
  };
}

export async function sendContactEmailNotification(
  args: ContactEmailArgs,
  dependencies: ContactEmailDependencies = {},
): Promise<ContactEmailSendResult> {
  const env = dependencies.env ?? process.env;
  const fetchImpl = dependencies.fetch ?? fetch;
  const logger = dependencies.logger ?? console;
  const apiKey = env.RESEND_API_KEY;
  const recipient = env.CONTACT_RECIPIENT_EMAIL ?? "vivekp.freelance@pm.me";
  const resendFromEmail = env.RESEND_FROM_EMAIL;
  const from = resendFromEmail ?? DEFAULT_FROM;

  if (isConvexProduction(env) && usesResendSandboxFrom(resendFromEmail)) {
    logger.error(
      "sendContactEmail: RESEND_FROM_EMAIL is unset or uses Resend sandbox",
      RESEND_SANDBOX_FROM,
      "in production. Set a verified-domain sender in the Convex dashboard (e.g.",
      "Portfolio Contact <hello@yourdomain.com>). Lead saved:",
      args.leadId,
    );
  }

  if (!apiKey) {
    logger.error(
      "sendContactEmail: RESEND_API_KEY is not set. Lead saved:",
      args.leadId,
    );
    return { status: "missing-api-key" };
  }

  const response = await fetchImpl("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildContactEmailPayload(args, { recipient, from })),
  });

  if (!response.ok) {
    const body = await response.text();
    logger.error(
      "sendContactEmail: Resend API error",
      response.status,
      body,
      "leadId:",
      args.leadId,
    );
    return { status: "resend-error", httpStatus: response.status, body };
  }

  return { status: "sent" };
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

    const cutoff = Date.now() - RATE_LIMIT_WINDOW_MS;
    const recent = await ctx.db
      .query("leads")
      .withIndex("by_email_and_createdAt", (q) =>
        q.eq("email", lead.email).gt("createdAt", cutoff),
      )
      .take(RATE_LIMIT_MAX_SUBMISSIONS);

    if (recent.length >= RATE_LIMIT_MAX_SUBMISSIONS) {
      throw new ConvexError("Please wait before submitting again.");
    }

    const leadId = await ctx.db.insert("leads", {
      ...lead,
      createdAt: Date.now(),
      emailNotificationStatus: "pending",
      emailNotificationUpdatedAt: Date.now(),
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

export const markEmailNotificationStatus = internalMutation({
  args: {
    leadId: v.id("leads"),
    status: v.union(
      v.literal("sent"),
      v.literal("missing_api_key"),
      v.literal("resend_error"),
      v.literal("unexpected_error"),
    ),
    error: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.leadId, {
      emailNotificationStatus: args.status,
      emailNotificationError: args.error,
      emailNotificationUpdatedAt: Date.now(),
    });
    return null;
  },
});

export const getStalePendingLeads = internalQuery({
  args: {
    cutoff: v.number(),
  },
  returns: v.array(
    v.object({
      _id: v.id("leads"),
      name: v.string(),
      email: v.string(),
      budget: v.optional(v.string()),
      description: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    const staleLeads = await ctx.db
      .query("leads")
      .withIndex("by_emailNotificationStatus_and_emailNotificationUpdatedAt", (q) =>
        q.eq("emailNotificationStatus", "pending").lt("emailNotificationUpdatedAt", args.cutoff)
      )
      .take(20);

    return staleLeads.map((lead) => ({
      _id: lead._id,
      name: lead.name,
      email: lead.email,
      budget: lead.budget,
      description: lead.description,
    }));
  },
});

function emailResultToStatus(
  result: ContactEmailSendResult,
): { status: EmailNotificationUpdateStatus; error?: string } {
  if (result.status === "sent") {
    return { status: "sent" };
  }

  if (result.status === "missing-api-key") {
    return {
      status: "missing_api_key",
      error: "RESEND_API_KEY is not set on this Convex deployment.",
    };
  }

  return {
    status: "resend_error",
    error: `Resend API returned ${result.httpStatus}: ${result.body}`,
  };
}

export const sendContactEmail = internalAction({
  args: {
    leadId: v.id("leads"),
    name: v.string(),
    email: v.string(),
    budget: v.optional(v.string()),
    description: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      const result = await sendContactEmailNotification(args);
      const update = emailResultToStatus(result);
      await ctx.runMutation(
        internal.leads.markEmailNotificationStatus,
        {
          leadId: args.leadId,
          ...update,
        },
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown email notification error";
      await ctx.runMutation(
        internal.leads.markEmailNotificationStatus,
        {
          leadId: args.leadId,
          status: "unexpected_error",
          error: message,
        },
      );
      throw error;
    }
    return null;
  },
});
