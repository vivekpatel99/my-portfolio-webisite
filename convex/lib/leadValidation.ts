import { ConvexError } from "convex/values";

export const BUDGET_OPTIONS = ["< €5k", "€5k-€10k", "€10k-€25k", "€25k+"] as const;
export const MIN_NAME_LENGTH = 1;
export const MAX_NAME_LENGTH = 200;
export const MIN_EMAIL_LENGTH = 5;
export const MAX_EMAIL_LENGTH = 254;
export const MIN_DESCRIPTION_LENGTH = 1;
export const MAX_DESCRIPTION_LENGTH = 5000;
export const MIN_BUDGET_LENGTH = 5;
export const MAX_BUDGET_LENGTH = 9;

// Bounds apply before normalization so large whitespace-only payloads never reach storage.
export const MAX_RAW_NAME_LENGTH = 400;
export const MAX_RAW_EMAIL_LENGTH = 508;
export const MAX_RAW_DESCRIPTION_LENGTH = 10_000;
export const MAX_RAW_BUDGET_LENGTH = 64;

export const CONTACT_LEAD_VALIDATION_ERROR =
  "We couldn't submit your request. Please check the form and try again.";
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ContactLeadInput = {
  name: string;
  email: string;
  budget?: string;
  description: string;
};

const CONTACT_LEAD_FIELDS = new Set(["name", "email", "budget", "description"]);
const DISALLOWED_SINGLE_LINE_CONTROLS =
  /[\u0000-\u001F\u007F-\u009F\u2028\u2029\u202A-\u202E\u2066-\u2069]/u;
const DISALLOWED_DESCRIPTION_CONTROLS =
  /[\u0000-\u0008\u000B-\u001F\u007F-\u009F\u202A-\u202E\u2066-\u2069]/u;

function rejectLeadInput(): never {
  throw new ConvexError(CONTACT_LEAD_VALIDATION_ERROR);
}

function isContactLeadInput(input: unknown): input is ContactLeadInput {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return false;
  }

  const record = input as Record<string, unknown>;
  const keys = Object.keys(record);
  if (
    keys.some((key) => !CONTACT_LEAD_FIELDS.has(key)) ||
    !Object.prototype.hasOwnProperty.call(record, "name") ||
    !Object.prototype.hasOwnProperty.call(record, "email") ||
    !Object.prototype.hasOwnProperty.call(record, "description") ||
    typeof record.name !== "string" ||
    typeof record.email !== "string" ||
    typeof record.description !== "string" ||
    (record.budget !== undefined && typeof record.budget !== "string")
  ) {
    return false;
  }

  return true;
}

function hasDisallowedControls(value: string, allowDescriptionWhitespace = false) {
  return (allowDescriptionWhitespace
    ? DISALLOWED_DESCRIPTION_CONTROLS
    : DISALLOWED_SINGLE_LINE_CONTROLS
  ).test(value);
}

function hasValidLength(value: string, minimum: number, maximum: number) {
  return value.length >= minimum && value.length <= maximum;
}

export function normalizeBudget(budget: string | undefined) {
  if (
    budget !== undefined &&
    (budget.length > MAX_RAW_BUDGET_LENGTH || hasDisallowedControls(budget))
  ) {
    rejectLeadInput();
  }

  const trimmed = budget?.trim();
  if (!trimmed) {
    return undefined;
  }
  if (
    !hasValidLength(trimmed, MIN_BUDGET_LENGTH, MAX_BUDGET_LENGTH) ||
    !BUDGET_OPTIONS.includes(trimmed as (typeof BUDGET_OPTIONS)[number])
  ) {
    rejectLeadInput();
  }
  return trimmed;
}

export function validateLeadInput(input: unknown) {
  if (!isContactLeadInput(input)) {
    rejectLeadInput();
  }

  if (
    input.name.length > MAX_RAW_NAME_LENGTH ||
    input.email.length > MAX_RAW_EMAIL_LENGTH ||
    input.description.length > MAX_RAW_DESCRIPTION_LENGTH ||
    hasDisallowedControls(input.name) ||
    hasDisallowedControls(input.email)
  ) {
    rejectLeadInput();
  }

  const normalizedDescription = input.description.replace(/\r\n?/g, "\n");
  if (hasDisallowedControls(normalizedDescription, true)) {
    rejectLeadInput();
  }

  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const description = normalizedDescription.trim();
  const budget = normalizeBudget(input.budget);

  if (
    !hasValidLength(name, MIN_NAME_LENGTH, MAX_NAME_LENGTH) ||
    !hasValidLength(email, MIN_EMAIL_LENGTH, MAX_EMAIL_LENGTH) ||
    !EMAIL_REGEX.test(email) ||
    !hasValidLength(description, MIN_DESCRIPTION_LENGTH, MAX_DESCRIPTION_LENGTH)
  ) {
    rejectLeadInput();
  }

  return { name, email, description, budget };
}
