import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  leads: defineTable({
    name: v.string(),
    email: v.string(),
    budget: v.optional(v.string()),
    description: v.string(),
    createdAt: v.number(),
    supabaseId: v.optional(v.string()),
  })
    .index("by_createdAt", ["createdAt"])
    .index("by_supabaseId", ["supabaseId"]),
});
