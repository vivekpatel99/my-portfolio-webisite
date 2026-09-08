import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";
import {
  BUDGET_OPTIONS,
  CONTACT_LEAD_VALIDATION_ERROR,
  MAX_DESCRIPTION_LENGTH,
  MAX_EMAIL_LENGTH,
  MAX_NAME_LENGTH,
  MAX_RAW_BUDGET_LENGTH,
  MAX_RAW_DESCRIPTION_LENGTH,
  MAX_RAW_EMAIL_LENGTH,
  MAX_RAW_NAME_LENGTH,
  validateLeadInput,
} from "./leadValidation";

const validInput = {
  name: "Jane Doe",
  email: "jane@example.com",
  description: "Need a reliable data pipeline.",
};

function expectInvalidLeadInput(input: unknown) {
  try {
    validateLeadInput(input);
  } catch (error) {
    expect(error).toBeInstanceOf(ConvexError);
    expect((error as ConvexError<string>).data).toBe(CONTACT_LEAD_VALIDATION_ERROR);
    return;
  }
  throw new Error("Expected input validation to fail");
}

describe("validateLeadInput", () => {
  it("normalizes surrounding whitespace, email case, and description line endings", () => {
    expect(
      validateLeadInput({
        name: "  Jane Doe  ",
        email: "  JANE@EXAMPLE.COM  ",
        budget: ` ${BUDGET_OPTIONS[2]} `,
        description: "  First line\r\n\tSecond line\rThird line  ",
      }),
    ).toEqual({
      name: "Jane Doe",
      email: "jane@example.com",
      budget: BUDGET_OPTIONS[2],
      description: "First line\n\tSecond line\nThird line",
    });
  });

  it("accepts the documented canonical length boundaries", () => {
    const email = `${"a".repeat(MAX_EMAIL_LENGTH - 5)}@b.cd`;
    expect(
      validateLeadInput({
        name: "n".repeat(MAX_NAME_LENGTH),
        email,
        description: "d".repeat(MAX_DESCRIPTION_LENGTH),
      }),
    ).toEqual({
      name: "n".repeat(MAX_NAME_LENGTH),
      email,
      budget: undefined,
      description: "d".repeat(MAX_DESCRIPTION_LENGTH),
    });

    expect(
      validateLeadInput({ name: "n", email: "a@b.c", description: "d" }),
    ).toMatchObject({ name: "n", email: "a@b.c", description: "d" });
  });

  it("permits each budget option and treats blank budget as absent", () => {
    for (const budget of BUDGET_OPTIONS) {
      expect(validateLeadInput({ ...validInput, budget }).budget).toBe(budget);
    }
    expect(validateLeadInput({ ...validInput, budget: "   " }).budget).toBeUndefined();
  });

  it("permits raw values at each bound and rejects one extra UTF-16 code unit", () => {
    const canonicalMaxEmail = `${"a".repeat(MAX_EMAIL_LENGTH - 5)}@b.cd`;
    expect(
      validateLeadInput({
        ...validInput,
        name: `${" ".repeat(MAX_RAW_NAME_LENGTH - MAX_NAME_LENGTH)}${"n".repeat(MAX_NAME_LENGTH)}`,
      }).name,
    ).toHaveLength(MAX_NAME_LENGTH);
    expect(
      validateLeadInput({
        ...validInput,
        email: `${" ".repeat(MAX_RAW_EMAIL_LENGTH - MAX_EMAIL_LENGTH)}${canonicalMaxEmail}`,
      }).email,
    ).toBe(canonicalMaxEmail);
    expect(
      validateLeadInput({
        ...validInput,
        description: `${" ".repeat(MAX_RAW_DESCRIPTION_LENGTH - MAX_DESCRIPTION_LENGTH)}${"d".repeat(MAX_DESCRIPTION_LENGTH)}`,
      }).description,
    ).toHaveLength(MAX_DESCRIPTION_LENGTH);
    expect(
      validateLeadInput({
        ...validInput,
        budget: `${" ".repeat(MAX_RAW_BUDGET_LENGTH - BUDGET_OPTIONS[2].length)}${BUDGET_OPTIONS[2]}`,
      }).budget,
    ).toBe(BUDGET_OPTIONS[2]);

    for (const input of [
      {
        ...validInput,
        name: `${" ".repeat(MAX_RAW_NAME_LENGTH - MAX_NAME_LENGTH + 1)}${"n".repeat(MAX_NAME_LENGTH)}`,
      },
      {
        ...validInput,
        email: `${" ".repeat(MAX_RAW_EMAIL_LENGTH - MAX_EMAIL_LENGTH + 1)}${canonicalMaxEmail}`,
      },
      {
        ...validInput,
        description: `${" ".repeat(MAX_RAW_DESCRIPTION_LENGTH - MAX_DESCRIPTION_LENGTH + 1)}${"d".repeat(MAX_DESCRIPTION_LENGTH)}`,
      },
      {
        ...validInput,
        budget: `${" ".repeat(MAX_RAW_BUDGET_LENGTH - BUDGET_OPTIONS[2].length + 1)}${BUDGET_OPTIONS[2]}`,
      },
    ]) {
      expectInvalidLeadInput(input);
    }
  });

  it("rejects malformed shapes, oversized canonical values, and disallowed controls", () => {
    const invalidInputs: unknown[] = [
      null,
      undefined,
      "private free text",
      42,
      false,
      [],
      {},
      { ...validInput, unexpected: "field" },
      { ...validInput, name: { value: "Jane" } },
      { ...validInput, name: "n".repeat(MAX_NAME_LENGTH + 1) },
      { ...validInput, email: `${"a".repeat(MAX_EMAIL_LENGTH - 4)}@b.cd` },
      { ...validInput, description: "d".repeat(MAX_DESCRIPTION_LENGTH + 1) },
      { ...validInput, budget: "€25k" },
      { ...validInput, budget: "€10k-€250k" },
      { ...validInput, name: "Jane\u0000Doe" },
      { ...validInput, email: "jane\t@example.com" },
      { ...validInput, budget: `${BUDGET_OPTIONS[0]}\u0001` },
      { ...validInput, description: "First\u000Bsecond" },
      { ...validInput, description: "\u000BFirst" },
      { ...validInput, description: "First\u000C" },
      { ...validInput, description: "First\u0085second" },
      { ...validInput, name: "Jane\u2028Doe" },
      { ...validInput, description: "First\u202Esecond" },
    ];

    for (const input of invalidInputs) {
      expectInvalidLeadInput(input);
    }
  });

  it("preserves Unicode names and emoji without accepting empty canonical values", () => {
    expect(
      validateLeadInput({
        name: "  Jane 👩‍💻  ",
        email: "jane@example.com",
        description: "项目说明",
      }),
    ).toMatchObject({ name: "Jane 👩‍💻", description: "项目说明" });

    for (const input of [
      { ...validInput, name: "   " },
      { ...validInput, email: "   " },
      { ...validInput, description: "   " },
    ]) {
      expectInvalidLeadInput(input);
    }
  });
});
