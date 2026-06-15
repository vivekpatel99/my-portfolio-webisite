import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

const PENDING_EMAIL_RETRY_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

export const retryPendingEmails = internalAction({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - PENDING_EMAIL_RETRY_THRESHOLD_MS;
    
    const stalePendingLeads: Array<{ 
      _id: Id<"leads">; 
      name: string; 
      email: string; 
      budget?: string; 
      description: string 
    }> = 
      await ctx.runQuery(internal.leads.getStalePendingLeads, { cutoff });
    
    if (stalePendingLeads.length === 0) {
      return { retriedCount: 0 };
    }
    
    console.log(`Found ${stalePendingLeads.length} stale pending email(s), retrying...`);
    
    for (const lead of stalePendingLeads) {
      await ctx.scheduler.runAfter(0, internal.leads.sendContactEmail, {
        leadId: lead._id,
        name: lead.name,
        email: lead.email,
        budget: lead.budget,
        description: lead.description,
      });
    }
    
    return { retriedCount: stalePendingLeads.length };
  },
});

const crons = cronJobs();

// Check for stale pending emails every 10 minutes
crons.interval(
  "retry stale pending email notifications",
  { minutes: 10 },
  internal.crons.retryPendingEmails,
  {}
);

export default crons;
