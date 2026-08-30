import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  leads: defineTable({
    name: v.string(),
    email: v.string(),
    budget: v.optional(v.string()),
    description: v.string(),
    createdAt: v.number(),
    emailNotificationStatus: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("sending"),
        v.literal("retrying"),
        v.literal("sent"),
        v.literal("missing_api_key"),
        v.literal("resend_error"),
        v.literal("unexpected_error"),
      ),
    ),
    emailNotificationError: v.optional(v.string()),
    emailNotificationUpdatedAt: v.optional(v.number()),
    emailNotificationAttemptCount: v.optional(v.number()),
    supabaseId: v.optional(v.string()),
  })
    .index("by_createdAt", ["createdAt"])
    .index("by_supabaseId", ["supabaseId"])
    .index("by_email", ["email"])
    .index("by_email_and_createdAt", ["email", "createdAt"])
    .index("by_emailNotificationStatus_and_emailNotificationUpdatedAt", [
      "emailNotificationStatus",
      "emailNotificationUpdatedAt",
    ]),
});
