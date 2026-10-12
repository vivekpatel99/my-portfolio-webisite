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

function getBudgetError(budget: string | undefined) {
  if (
    budget !== undefined &&
    (budget.length > MAX_RAW_BUDGET_LENGTH || hasDisallowedControls(budget))
  ) {
    return "Choose one of the listed budget ranges, or leave it blank.";
  }

  const trimmed = budget?.trim();
  if (!trimmed) {
    return undefined;
  }
  if (
    !hasValidLength(trimmed, MIN_BUDGET_LENGTH, MAX_BUDGET_LENGTH) ||
    !BUDGET_OPTIONS.includes(trimmed as (typeof BUDGET_OPTIONS)[number])
  ) {
    return "Choose one of the listed budget ranges, or leave it blank.";
  }
}

export function normalizeBudget(budget: string | undefined) {
  if (getBudgetError(budget)) {
    rejectLeadInput();
  }
  return budget?.trim() || undefined;
}

export type ContactLeadFieldErrors = Partial<Record<keyof ContactLeadInput, string>>;
type ContactLeadValidationResult =
  | { ok: true; value: ContactLeadInput }
  | { ok: false; errors: ContactLeadFieldErrors };

export function validateContactFields(input: ContactLeadInput): ContactLeadValidationResult {
  const name = input.name.length <= MAX_RAW_NAME_LENGTH ? input.name.trim() : "";
  const email = input.email.length <= MAX_RAW_EMAIL_LENGTH ? input.email.trim().toLowerCase() : "";
  const normalizedDescription = input.description.length <= MAX_RAW_DESCRIPTION_LENGTH
    ? input.description.replace(/\r\n?/g, "\n")
    : "";
  const description = normalizedDescription.trim();
  const errors: ContactLeadFieldErrors = {};

  if (input.name.length > MAX_RAW_NAME_LENGTH) {
    errors.name = `Full name must be ${MAX_NAME_LENGTH} characters or fewer. Remove extra surrounding whitespace.`;
  } else if (name.length < MIN_NAME_LENGTH) {
    errors.name = "Name is required.";
  } else if (name.length > MAX_NAME_LENGTH) {
    errors.name = `Full name must be ${MAX_NAME_LENGTH} characters or fewer.`;
  } else if (hasDisallowedControls(input.name)) {
    errors.name = "Remove line breaks and hidden control characters from your full name.";
  }

  if (input.email.length > MAX_RAW_EMAIL_LENGTH) {
    errors.email = `Email address must be ${MAX_EMAIL_LENGTH} characters or fewer. Remove extra surrounding whitespace.`;
  } else if (!email) {
    errors.email = "Email is required.";
  } else if (email.length > MAX_EMAIL_LENGTH) {
    errors.email = `Email address must be ${MAX_EMAIL_LENGTH} characters or fewer.`;
  } else if (hasDisallowedControls(input.email) || email.length < MIN_EMAIL_LENGTH || !EMAIL_REGEX.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  const budgetError = getBudgetError(input.budget);
  if (budgetError) errors.budget = budgetError;

  if (input.description.length > MAX_RAW_DESCRIPTION_LENGTH) {
    errors.description = `Project description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer. Remove extra surrounding whitespace.`;
  } else if (description.length < MIN_DESCRIPTION_LENGTH) {
    errors.description = "Project description is required.";
  } else if (description.length > MAX_DESCRIPTION_LENGTH) {
    errors.description = `Project description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.`;
  } else if (hasDisallowedControls(normalizedDescription, true)) {
    errors.description = "Remove hidden control characters from your project description.";
  }

  return Object.keys(errors).length
    ? { ok: false, errors }
    : { ok: true, value: { name, email, description, budget: input.budget?.trim() || undefined } };
}

export function validateLeadInput(input: unknown) {
  if (!isContactLeadInput(input)) {
    rejectLeadInput();
  }
  const result = validateContactFields(input);
  if (!result.ok) rejectLeadInput();
  return result.value;
}
