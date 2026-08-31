import { ConvexError, v } from "convex/values";
import { internal } from "../_generated/api";
import { internalMutation } from "../_generated/server";
import { validateLeadInput } from "../lib/leadValidation";

const importRowValidator = v.object({
  name: v.string(),
  email: v.string(),
  budget: v.optional(v.string()),
  description: v.string(),
  createdAt: v.optional(v.number()),
});

const MAX_IMPORT_BATCH_SIZE = 100;
const MAX_FUTURE_CREATED_AT_MS = 24 * 60 * 60 * 1000;
const LEGACY_CLEANUP_BATCH_SIZE = 100;

function isValidCreatedAt(createdAt: number | undefined, now: number) {
  if (createdAt === undefined) {
    return true;
  }
  return (
    Number.isFinite(createdAt) &&
    createdAt > 0 &&
    createdAt <= now + MAX_FUTURE_CREATED_AT_MS
  );
}

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
    if (rows.length > MAX_IMPORT_BATCH_SIZE) {
      throw new ConvexError(`Import batches are limited to ${MAX_IMPORT_BATCH_SIZE} rows.`);
    }

    let inserted = 0;
    let skipped = 0;
    let invalid = 0;
    const now = Date.now();

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

      if (!isValidCreatedAt(row.createdAt, now)) {
        invalid += 1;
        continue;
      }

      await ctx.db.insert("leads", {
        ...lead,
        createdAt: row.createdAt ?? now,
      });
      inserted += 1;
    }

    return { inserted, skipped, invalid };
  },
});

export const removeLegacySupabaseIds = internalMutation({
  args: {
    cursor: v.optional(v.string()),
  },
  returns: v.object({
    scanned: v.number(),
    cleaned: v.number(),
    continueCursor: v.string(),
    isDone: v.boolean(),
  }),
  handler: async (ctx, { cursor }): Promise<{
    scanned: number;
    cleaned: number;
    continueCursor: string;
    isDone: boolean;
  }> => {
    const page = await ctx.db.query("leads").paginate({
      numItems: LEGACY_CLEANUP_BATCH_SIZE,
      cursor: cursor ?? null,
    });
    let cleaned = 0;

    for (const lead of page.page) {
      if (lead.supabaseId !== undefined) {
        await ctx.db.patch("leads", lead._id, { supabaseId: undefined });
        cleaned += 1;
      }
    }

    if (!page.isDone) {
      await ctx.scheduler.runAfter(
        0,
        internal.migrations.importLeads.removeLegacySupabaseIds,
        { cursor: page.continueCursor },
      );
    }

    return {
      scanned: page.page.length,
      cleaned,
      continueCursor: page.continueCursor,
      isDone: page.isDone,
    };
  },
});
