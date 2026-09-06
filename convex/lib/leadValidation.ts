import { ConvexError } from "convex/values";
import { normalizeInquiryContext, type InquiryContext } from "./inquiryContext";

export const BUDGET_OPTIONS = ["< €5k", "€5k-€10k", "€10k-€25k", "€25k+"] as const;
export const MAX_NAME_LENGTH = 200;
export const MAX_DESCRIPTION_LENGTH = 5000;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeBudget(budget: string | undefined) {
  const trimmed = budget?.trim();
  if (!trimmed) {
    return undefined;
  }
  if (!BUDGET_OPTIONS.includes(trimmed as (typeof BUDGET_OPTIONS)[number])) {
    throw new ConvexError("Invalid budget range.");
  }
  return trimmed;
}

export function validateLeadInput(args: {
  name: string;
  email: string;
  budget?: string;
  description: string;
  inquiryContext?: unknown;
}) {
  const name = args.name.trim();
  const email = args.email.trim().toLowerCase();
  const description = args.description.trim();
  const budget = normalizeBudget(args.budget);
  let inquiryContext: InquiryContext | undefined;
  try {
    inquiryContext = normalizeInquiryContext(args.inquiryContext);
  } catch {
    throw new ConvexError("Invalid estimate context.");
  }

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

  return { name, email, description, budget, inquiryContext };
}
