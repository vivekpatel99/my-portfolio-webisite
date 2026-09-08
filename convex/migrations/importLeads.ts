import { ConvexError, v } from "convex/values";
import { internalMutation, type MutationCtx } from "../_generated/server";
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

export function insertImportedLead(
  ctx: Pick<MutationCtx, "db">,
  lead: ReturnType<typeof validateLeadInput>,
  createdAt: number,
) {
  return ctx.db.insert("leads", {
    name: lead.name,
    email: lead.email,
    budget: lead.budget,
    description: lead.description,
    createdAt,
  });
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
        lead = validateLeadInput({
          name: row.name,
          email: row.email,
          budget: row.budget,
          description: row.description,
        });
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

      await insertImportedLead(ctx, lead, row.createdAt ?? now);
      inserted += 1;
    }

    return { inserted, skipped, invalid };
  },
});
