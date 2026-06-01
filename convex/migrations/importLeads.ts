import { v } from "convex/values";
import { internalMutation } from "../_generated/server";

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
  }),
  handler: async (ctx, { rows }) => {
    let inserted = 0;
    let skipped = 0;

    for (const row of rows) {
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
        name: row.name.trim(),
        email: row.email.trim(),
        budget: row.budget?.trim() || undefined,
        description: row.description.trim(),
        createdAt: row.createdAt ?? Date.now(),
        supabaseId: row.supabaseId,
      });
      inserted += 1;
    }

    return { inserted, skipped };
  },
});
