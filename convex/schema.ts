import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  leads: defineTable({
    name: v.string(),
    email: v.string(),
    budget: v.optional(v.string()),
    description: v.string(),
    inquiryContext: v.optional(
      v.object({
        origin: v.optional(v.union(v.literal("service"), v.literal("case-study"), v.literal("fit-diagnostic"))),
        projectType: v.optional(v.union(v.literal("document-web-extraction"), v.literal("workflow-automation"), v.literal("computer-vision"))),
        serviceId: v.optional(v.union(v.literal("document-web-extraction"), v.literal("workflow-automation"), v.literal("computer-vision"))),
        caseStudySlug: v.optional(v.union(v.literal("n8n-openai-data-extraction"), v.literal("invoice-ocr-extraction"), v.literal("yolo-computer-vision-optimization"))),
        fitDecision: v.optional(v.union(v.literal("strong-fit"), v.literal("possible-fit"), v.literal("not-recommended"))),
        timeline: v.optional(v.union(v.literal("exploring"), v.literal("within-one-month"), v.literal("one-to-three-months"), v.literal("flexible"))),
        currentBlocker: v.optional(v.union(v.literal("defining-inputs"), v.literal("defining-handoff"), v.literal("workflow-reliability"), v.literal("review-ownership"))),
      }),
    ),
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
    .index("by_email", ["email"])
    .index("by_email_and_createdAt", ["email", "createdAt"])
    .index("by_emailNotificationStatus_and_emailNotificationUpdatedAt", [
      "emailNotificationStatus",
      "emailNotificationUpdatedAt",
    ]),
});
