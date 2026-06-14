import { ConvexError, v } from "convex/values";
import { internalMutation } from "../_generated/server";
import { validateLeadInput } from "../lib/leadValidation";

const importRowValidator = v.object({
  name: v.string(),
  email: v.string(),
  budget: v.optional(v.string()),
  description: v.string(),
  createdAt: v.optional(v.number()),
  supabaseId: v.optional(v.string()),
});

export const importFromRows = internalMutation({
  args: {
    rows: v.array(importRowValidator),
  },
  returns: v.object({
    inserted: v.number(),
    skipped: v.number(),
    invalid: v.number(),
  }),
  handler: async (ctx, { rows }) => {
    let inserted = 0;
    let skipped = 0;
    let invalid = 0;

    for (const row of rows) {
      let lead;
      try {
        lead = validateLeadInput(row);
      } catch (error) {
        if (error instanceof ConvexError) {
          invalid += 1;
          continue;
        }
        throw error;
      }

      if (row.supabaseId) {
        const existing = await ctx.db
          .query("leads")
          .withIndex("by_supabaseId", (q) => q.eq("supabaseId", row.supabaseId))
          .unique();
        if (existing) {
          skipped += 1;
          continue;
        }
      }

      await ctx.db.insert("leads", {
        ...lead,
        createdAt: row.createdAt ?? Date.now(),
        supabaseId: row.supabaseId,
      });
      inserted += 1;
    }

    return { inserted, skipped, invalid };
  },
});
